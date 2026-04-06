---
read_when:
    - Crear o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de plugins o los límites de propiedad
    - Trabajar en el canal de carga de plugins o en el registro
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos de plugins: modelo de capacidades, propiedad, contratos, canal de carga y asistentes de tiempo de ejecución'
title: Aspectos internos de plugins
x-i18n:
    generated_at: "2026-04-06T03:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d39158455701dedfb75f6c20b8c69fd36ed9841f1d92bed1915f448df57fd47b
    source_path: plugins/architecture.md
    workflow: 15
---

# Aspectos internos de plugins

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía de usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Resumen del SDK](/es/plugins/sdk-overview) — mapa de importaciones y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **plugins nativos** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad              | Método de registro                              | Plugins de ejemplo                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| Comprensión de medios  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                    |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| Recuperación web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                              |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y lo usan hoy los plugins
empaquetados/nativos, pero la compatibilidad de plugins externos todavía necesita un criterio
más estricto que “se exporta, por lo tanto está congelado”.

Directrices actuales:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trátalo
  como la base de compatibilidad
- **nuevos plugins empaquetados/nativos:** prefiere el registro explícito de capacidades antes que
  accesos específicos de proveedor o nuevos diseños solo con hooks
- **plugins externos que adopten el registro de capacidades:** permitido, pero trata las superficies
  auxiliares específicas de cada capacidad como evolutivas salvo que la documentación marque
  explícitamente un contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la vía más segura para no romper plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son iguales; prefiere el contrato estrecho documentado,
  no exportaciones auxiliares incidentales

### Formas de plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro, no solo por metadatos estáticos:

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` es propietario de inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose
de capacidades. Consulta [Referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como vía de compatibilidad para
plugins solo con hooks. Los plugins heredados del mundo real siguen dependiendo de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de sustitución de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo cuando baje su uso real y la cobertura de fixtures demuestre una migración segura

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                   |
| ------------------------- | ------------------------------------------------------------- |
| **config valid**          | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero antiguo (p. ej. `hook-only`) |
| **legacy warning**        | El plugin usa `before_agent_start`, que está deprecado        |
| **hard error**            | La configuración no es válida o el plugin no se pudo cargar   |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es una advertencia, y `before_agent_start` solo activa un aviso. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifest + descubrimiento**
   OpenClaw encuentra plugins candidatos desde rutas configuradas, raíces del workspace,
   raíces globales de extensiones y extensiones empaquetadas. El descubrimiento lee primero
   los manifests nativos `openclaw.plugin.json` más los manifests compatibles admitidos.
2. **Habilitación + validación**
   El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un slot exclusivo como memoria.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan dentro del proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficie**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración
   de proveedores, hooks, rutas HTTP, comandos CLI y servicios.

En el caso concreto de la CLI de plugins, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de CLI del plugin puede seguir siendo diferido y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, mientras permite que OpenClaw
reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento y la validación de configuración deben funcionar a partir de **metadatos de manifest/schema**
  sin ejecutar código del plugin
- el comportamiento nativo de tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa separación permite a OpenClaw validar configuración, explicar plugins ausentes/deshabilitados y
construir sugerencias de UI/schema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y
los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo es propietario del host compartido de la herramienta `message`, del cableado del prompt, de la contabilidad
  de sesión/hilo y del despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones con ámbito, del descubrimiento de capacidades y de cualquier
  fragmento de schema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como
  cómo los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada
permite que un plugin devuelva juntas sus acciones visibles, capacidades y contribuciones al schema
para que esas piezas no se desincronicen.

El núcleo pasa el ámbito de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensaje en función de la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante sin codificar ramas específicas del canal en la herramienta
central `message`.

Por eso los cambios de enrutamiento del runner embebido siguen siendo trabajo de plugins: el runner es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin
para que la herramienta compartida `message` exponga la superficie correcta propiedad del canal
para el turno actual.

Para asistentes de ejecución propiedad del canal, los plugins empaquetados deben mantener el tiempo de ejecución
de ejecución dentro de sus propios módulos de extensión. El núcleo ya no es propietario de los tiempos de ejecución
de acciones de mensaje de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los plugins empaquetados
deben importar directamente su propio código de tiempo de ejecución local desde sus
módulos propiedad de la extensión.

Ese mismo límite se aplica a las costuras del SDK con nombre de proveedor en general: el núcleo no debe
importar barriles auxiliares de conveniencia específicos de canal para Slack, Discord, Signal,
WhatsApp o extensiones similares. Si el núcleo necesita un comportamiento, debe consumir el
propio barril `api.ts` / `runtime-api.ts` del plugin empaquetado o elevar la necesidad a una capacidad
genérica y estrecha dentro del SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común de
  encuestas
- `actions.handleAction("poll")` es la ruta preferida para semántica de encuestas específica del canal
  o parámetros adicionales de encuestas

Ahora el núcleo aplaza el análisis compartido de encuestas hasta después de que el despacho de encuestas
del plugin rechace la acción, de modo que los manejadores de encuestas propiedad del plugin puedan aceptar
campos de encuesta específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canal de carga](#load-pipeline) para la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una
**función**, no como un conjunto desordenado de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe ser propietario de todas las superficies de OpenClaw
  de esa empresa
- un plugin de función normalmente debe ser propietario de toda la superficie de la función que introduce
- los canales deben consumir capacidades compartidas del núcleo en lugar de volver a implementar
  el comportamiento del proveedor de forma ad hoc

Ejemplos:

- el plugin empaquetado `openai` es propietario del comportamiento de proveedor de modelos de OpenAI y del comportamiento de OpenAI
  de voz + voz en tiempo real + comprensión de medios + generación de imágenes
- el plugin empaquetado `elevenlabs` es propietario del comportamiento de voz de ElevenLabs
- el plugin empaquetado `microsoft` es propietario del comportamiento de voz de Microsoft
- el plugin empaquetado `google` es propietario del comportamiento de proveedor de modelos de Google más comportamiento de Google
  de comprensión de medios + generación de imágenes + búsqueda web
- el plugin empaquetado `firecrawl` es propietario del comportamiento de recuperación web de Firecrawl
- los plugins empaquetados `minimax`, `mistral`, `moonshot` y `zai` son propietarios de sus
  backends de comprensión de medios
- el plugin `voice-call` es un plugin de función: es propietario del transporte de llamadas, herramientas,
  CLI, rutas y puente de flujo de medios de Twilio, pero consume las capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de importar plugins de proveedor directamente

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué plugin de proveedor es propietario del proveedor; consumen el
  contrato de capacidad compartido expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Por tanto, si OpenClaw añade un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debería codificar de forma rígida el manejo de video?”. La primera pregunta es “¿cuál es
el contrato de capacidad central para video?”. Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad que falta en el núcleo
2. exponerla a través de la API/tiempo de ejecución del plugin de forma tipada
3. conectar canales/funciones a esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene la propiedad explícita a la vez que evita comportamiento del núcleo que dependa de
un solo proveedor o de una ruta de código específica de un plugin aislado.

### Capas de capacidad

Usa este modelo mental al decidir dónde debe vivir el código:

- **capa de capacidades del núcleo**: orquestación compartida, políticas, fallback, reglas de
  combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugins de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugins de canal/función**: integración de Slack/Discord/voice-call/etc.
  que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo es propietario de la política de TTS en tiempo de respuesta, el orden de fallback, preferencias y entrega por canal
- `openai`, `elevenlabs` y `microsoft` son propietarios de las implementaciones de síntesis
- `voice-call` consume el asistente de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debe preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de video, recuperación web y búsqueda web,
un proveedor puede ser propietario de todas sus superficies en un solo lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hooks de auth/catálogo de modelos/tiempo de ejecución
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuración de voz del proveedor — implementa directamente la interfaz SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // lógica de credenciales + fetch
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de los asistentes. Importa la forma:

- un solo plugin es propietario de la superficie del proveedor
- el núcleo sigue siendo propietario de los contratos de capacidad
- los canales y plugins de funciones consumen asistentes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que
  dice poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una única
capacidad compartida. El mismo modelo de propiedad se aplica allí:

1. el núcleo define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y de funciones consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita incrustar en el núcleo los supuestos de video de un solo proveedor. El plugin es propietario
de la superficie del proveedor; el núcleo es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el núcleo es propietario del contrato tipado
de capacidad y del asistente de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista concreta de despliegue? Consulta
[Recetario de capacidades](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins es intencionadamente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los asistentes de tiempo de ejecución de los que un plugin puede depender.

Por qué importa:

- los autores de plugins obtienen un único estándar interno estable
- el núcleo puede rechazar propiedad duplicada, como dos plugins que registren el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden imponer la propiedad de plugins empaquetados y evitar desvíos silenciosos

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros conforme se cargan los plugins. Ejemplos:
   ids duplicados de proveedor, ids duplicados de proveedor de voz y
   registros mal formados producen diagnósticos del plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins empaquetados se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro empaquetado.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin es propietario de qué
superficie. Eso permite que el núcleo y los canales se compongan sin fricción, porque la propiedad está
declarada, tipada y sometida a pruebas en lugar de ser implícita.

### Qué debe pertenecer a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de capacidad
- propiedad del núcleo
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocer al proveedor

Los malos contratos de plugins son:

- políticas específicas del proveedor ocultas en el núcleo
- escapes aislados de plugins que eluden el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **dentro del proceso** con la Gateway. No están
aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error en un plugin nativo puede hacer fallar o desestabilizar la gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro
  del proceso de OpenClaw

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills empaquetadas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no empaquetados. Trata
los plugins del workspace como código para tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes de workspace empaquetados, mantén el id del plugin anclado en el nombre
npm: `@openclaw/<id>` por defecto, o con un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionadamente un rol de plugin más estrecho.

Nota importante de confianza:

- `plugins.allow` confía en **ids de plugin**, no en la procedencia del origen.
- Un plugin del workspace con el mismo id que un plugin empaquetado eclipsa intencionadamente
  la copia empaquetada cuando ese plugin del workspace está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no comodidad de implementación.

Mantén público el registro de capacidades. Reduce exportaciones auxiliares que no sean contrato:

- subrutas específicas de asistentes de plugins empaquetados
- subrutas de infraestructura de tiempo de ejecución no destinadas a API pública
- asistentes de conveniencia específicos del proveedor
- asistentes de configuración/onboarding que son detalles de implementación

Algunas subrutas auxiliares de plugins empaquetados aún permanecen en el mapa generado de exportaciones del SDK
por compatibilidad y mantenimiento de plugins empaquetados. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias costuras `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins de terceros.

## Canal de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifests nativos o de bundles compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga los módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve lo que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins empaquetados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es escribible por cualquiera o
la propiedad de la ruta parece sospechosa para plugins no empaquetados.

### Comportamiento centrado en el manifest

El manifest es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/schema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de la Control UI
- mostrar metadatos de instalación/catálogo

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves dentro del proceso para:

- resultados de descubrimiento
- datos del registro de manifests
- registros de plugins cargados

Estas cachés reducen picos de inicio y sobrecarga por comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para deshabilitar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente variables globales aleatorias del núcleo. Se registran en un
registro central de plugins.

El registro hace seguimiento de:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- manejadores RPC de la gateway
- rutas HTTP
- registradores CLI
- servicios en segundo plano
- comandos propiedad del plugin

Las funciones del núcleo leen luego de ese registro en lugar de hablar directamente con módulos
de plugins. Esto mantiene la carga en una sola dirección:

- módulo de plugin -> registro en el registro
- tiempo de ejecución del núcleo -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del núcleo solo
necesitan un punto de integración: “leer el registro”, no “hacer un caso especial para cada módulo
de plugin”.

## Callbacks de enlace de conversación

Los plugins que enlazan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud
de enlace se apruebe o se deniegue:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ahora existe un enlace para este plugin + conversación.
        console.log(event.binding?.conversationId);
        return;
      }

      // La solicitud fue denegada; limpia cualquier estado local pendiente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: el enlace resuelto para solicitudes aprobadas
- `request`: el resumen de la solicitud original, pista de separación, id del remitente y
  metadatos de conversación

Este callback es solo de notificación. No cambia quién tiene permiso para enlazar una
conversación y se ejecuta después de que termine el manejo de aprobaciones del núcleo.

## Hooks de tiempo de ejecución de proveedores

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifest: `providerAuthEnvVars` para búsqueda barata de autenticación por entorno antes
  de cargar el tiempo de ejecución, además de `providerAuthChoices` para etiquetas baratas de onboarding/elección de autenticación
  y metadatos de flags CLI antes de cargar el tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / heredado `discovery` más `applyConfigDefaults`
- hooks de tiempo de ejecución: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw sigue siendo propietario del bucle genérico del agente, del failover, del manejo de transcripciones y
de la política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar un transporte completo de inferencia personalizado.

Usa el manifest `providerAuthEnvVars` cuando el proveedor tenga credenciales basadas en entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el tiempo de ejecución del plugin.
Usa el manifest `providerAuthChoices` cuando las superficies CLI de onboarding/elección de autenticación
deban conocer el id de elección del proveedor, etiquetas de grupo y cableado simple de autenticación con una sola flag
sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor para pistas orientadas
al operador, como etiquetas de onboarding o vars de configuración de client-id/client-secret de OAuth.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a hooks aproximadamente en este orden.
La columna “Cuándo usarlo” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                               | Cuándo usarlo                                                                                                                            |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json` | El proveedor es propietario de un catálogo o valores predeterminados de base URL                                                      |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales propiedad del proveedor durante la materialización de configuración | Los valores predeterminados dependen del modo de autenticación, el entorno o la semántica de familias de modelos del proveedor    |
| --  | _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                            | _(no es un hook de plugin)_                                                                                                              |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de ids de modelo antes de la búsqueda      | El proveedor es propietario de la limpieza de alias antes de la resolución canónica del modelo                                         |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de familias de proveedor antes del ensamblado genérico del modelo | El proveedor es propietario de la limpieza de transporte para ids de proveedor personalizados dentro de la misma familia de transporte |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de proveedor/tiempo de ejecución | El proveedor necesita limpieza de configuración que debe vivir con el plugin; los asistentes empaquetados de familia Google también respaldan entradas compatibles de configuración de Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a proveedores de configuración | El proveedor necesita correcciones de metadatos de uso de streaming nativo impulsadas por endpoints                                  |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación de marcador de entorno para proveedores de configuración antes de cargar la autenticación de tiempo de ejecución | El proveedor tiene resolución propia de API key mediante marcadores de entorno; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/autoalojada o basada en configuración sin persistir texto sin formato | El proveedor puede operar con un marcador sintético/local de credenciales                                                             |
| 9   | `shouldDeferSyntheticProfileAuth` | Da menor prioridad a placeholders sintéticos almacenados en perfil frente a autenticación respaldada por env/config | El proveedor almacena perfiles placeholder sintéticos que no deben tener prioridad                                                   |
| 10  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo propiedad del proveedor que aún no están en el registro local | El proveedor acepta ids arbitrarios de modelos ascendentes                                                                             |
| 11  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo               | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                               |
| 12  | `normalizeResolvedModel`          | Reescritura final antes de que el runner embebido use el modelo resuelto               | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del núcleo                                            |
| 13  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos de proveedor detrás de otro transporte compatible | El proveedor reconoce sus propios modelos en transportes proxy sin asumir la propiedad del proveedor                                |
| 14  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por lógica compartida del núcleo | El proveedor necesita peculiaridades de familia de proveedor/transcripción                                                          |
| 15  | `normalizeToolSchemas`            | Normaliza schemas de herramientas antes de que los vea el runner embebido              | El proveedor necesita limpieza de schemas de familias de transporte                                                                     |
| 16  | `inspectToolSchemas`              | Expone diagnósticos de schemas propiedad del proveedor después de la normalización      | El proveedor quiere avisos de palabras clave sin enseñar reglas específicas del proveedor al núcleo                                     |
| 17  | `resolveReasoningOutputMode`      | Selecciona contrato de salida de razonamiento nativo frente a etiquetado                | El proveedor necesita razonamiento etiquetado/salida final en lugar de campos nativos                                                  |
| 18  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de envoltorios genéricos de opciones de stream | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                 |
| 19  | `createStreamFn`                  | Sustituye por completo la ruta normal de stream con un transporte personalizado         | El proveedor necesita un protocolo de cable personalizado, no solo un envoltorio                                                       |
| 20  | `wrapStreamFn`                    | Envoltorio de stream después de aplicar envoltorios genéricos                           | El proveedor necesita envoltorios de compatibilidad de headers/cuerpo/modelo sin un transporte personalizado                           |
| 21  | `resolveTransportTurnState`       | Adjunta headers o metadatos nativos por turno                                           | El proveedor quiere que transportes genéricos envíen identidad de turno nativa del proveedor                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Adjunta headers nativos de WebSocket o política de enfriamiento de sesión               | El proveedor quiere que transportes WS genéricos ajusten headers de sesión o política de fallback                                      |
| 23  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena de tiempo de ejecución `apiKey` | El proveedor almacena metadatos extra de autenticación y necesita una forma personalizada del token en tiempo de ejecución      |
| 24  | `refreshOAuth`                    | Sustitución de actualización OAuth para endpoints de actualización personalizados o política ante fallo de actualización | El proveedor no encaja con los actualizadores compartidos `pi-ai`                                                                  |
| 25  | `buildAuthDoctorHint`             | Pista de reparación añadida cuando falla la actualización de OAuth                      | El proveedor necesita guía propia de reparación de autenticación después de un fallo de actualización                                   |
| 26  | `matchesContextOverflowError`     | Coincidencia de overflow de ventana de contexto propiedad del proveedor                 | El proveedor tiene errores de overflow en bruto que las heurísticas genéricas no detectarían                                            |
| 27  | `classifyFailoverReason`          | Clasificación de motivo de failover propiedad del proveedor                             | El proveedor puede mapear errores brutos de API/transporte a límite de tasa/sobrecarga/etc.                                            |
| 28  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                            | El proveedor necesita control de TTL de caché específico del proxy                                                                      |
| 29  | `buildMissingAuthMessage`         | Sustitución para el mensaje genérico de recuperación por falta de autenticación         | El proveedor necesita una pista específica de recuperación por autenticación faltante                                                   |
| 30  | `suppressBuiltInModel`            | Supresión de modelo integrado obsoleto más pista opcional de error orientada al usuario | El proveedor necesita ocultar filas ascendentes obsoletas o sustituirlas por una pista del proveedor                                   |
| 31  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo añadidas tras el descubrimiento                    | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                           |
| 32  | `isBinaryThinking`                | Conmutador de razonamiento activado/desactivado para proveedores de pensamiento binario | El proveedor expone solo pensamiento binario activado/desactivado                                                                       |
| 33  | `supportsXHighThinking`           | Compatibilidad con razonamiento `xhigh` para modelos seleccionados                      | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | Nivel predeterminado de `/think` para una familia de modelos concreta                   | El proveedor es propietario de la política predeterminada de `/think` para una familia de modelos                                      |
| 35  | `isModernModelRef`                | Coincidencia de modelo moderno para filtros de perfil en vivo y selección de smoke      | El proveedor es propietario de la coincidencia de modelos preferidos para live/smoke                                                    |
| 36  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o credencial efímera de solicitud                                                   |
| 37  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies relacionadas de estado | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial diferente de uso                                |
| 38  | `fetchUsageSnapshot`              | Obtiene y normaliza instantáneas de uso/cuota específicas del proveedor tras resolver la autenticación | El proveedor necesita un endpoint específico de uso o un analizador de carga útil específico                                        |
| 39  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memoria/búsqueda      | El comportamiento de embeddings para memoria debe pertenecer al plugin del proveedor                                                     |
| 40  | `buildReplayPolicy`               | Devuelve una política de replay que controla el manejo de transcripciones para el proveedor | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de pensamiento)               |
| 41  | `sanitizeReplayHistory`           | Reescribe el historial de replay tras la limpieza genérica de transcripciones           | El proveedor necesita reescrituras específicas del proveedor más allá de asistentes compartidos de compactación                         |
| 42  | `validateReplayTurns`             | Validación o reestructuración final de turnos de replay antes del runner embebido       | El transporte del proveedor necesita validación más estricta de turnos después del saneamiento genérico                                 |
| 43  | `onModelSelected`                 | Ejecuta efectos secundarios propiedad del proveedor después de la selección              | El proveedor necesita telemetría o estado propio cuando un modelo pasa a estar activo                                                   |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de proveedor coincidente y luego recorren otros plugins de proveedor con hooks
hasta que uno cambie realmente el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/compatibilidad de proveedores sin requerir que quien llama sepa qué
plugin empaquetado es propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada compatible
de configuración de familia Google, el normalizador empaquetado de configuración de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase distinta de extensión. Estos hooks son para comportamiento del proveedor
que sigue ejecutándose sobre el bucle normal de inferencia de OpenClaw.

### Ejemplo de proveedor

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ejemplos integrados

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  y `wrapStreamFn` porque es propietario de la compatibilidad futura de Claude 4.6,
  pistas de familia de proveedor, guía de reparación de autenticación, integración
  de endpoint de uso, elegibilidad de caché de prompts, valores predeterminados de configuración conscientes de autenticación, política
  predeterminada/adaptativa de pensamiento de Claude y modelado específico de streams de Anthropic para
  headers beta, `/fast` / `serviceTier` y `context1m`.
- Los asistentes de stream específicos de Claude de Anthropic se mantienen por ahora en la propia
  costura pública `api.ts` / `contract-api.ts` del plugin empaquetado. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los builders de menor nivel
  de envoltorios Anthropic en lugar de ampliar el SDK genérico en torno a las reglas de headers beta de un
  solo proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities` además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque es propietario de la compatibilidad futura de GPT-5.4, de la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, de las pistas de autenticación conscientes de Codex,
  de la supresión de Spark, de filas sintéticas de lista OpenAI y de la política de pensamiento /
  modelo en vivo de GPT-5; la familia de streams `openai-responses-defaults` es propietaria
  de los envoltorios compartidos de OpenAI Responses para headers de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  modelado de cargas de compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog` además de `resolveDynamicModel` y
  `prepareDynamicModel` porque el proveedor es de paso y puede exponer nuevos
  ids de modelo antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del núcleo los headers de solicitud específicos del proveedor, metadatos de enrutamiento, parches de razonamiento y política de caché de prompts.
  Su política de replay proviene de la familia
  `passthrough-gemini`, mientras que la familia de streams `openrouter-thinking`
  es propietaria de la inyección de razonamiento proxy y de los saltos por modelo no compatible / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities` además de `prepareRuntimeAuth` y `fetchUsageSnapshot` porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de fallback de modelos, peculiaridades
  de transcripción de Claude, intercambio de token de GitHub -> token de Copilot y un
  endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog` además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot` porque
  sigue ejecutándose sobre transportes centrales de OpenAI, pero es propietario de su
  normalización de transporte/base URL, política de fallback de actualización OAuth, elección predeterminada de transporte,
  filas sintéticas de catálogo Codex e integración del endpoint de uso de ChatGPT; comparte la misma familia de streams `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de replay `google-gemini` es propietaria del fallback de compatibilidad futura de Gemini 3.1,
  de la validación nativa de replay de Gemini, del saneamiento de replay de bootstrap, del modo de salida
  de razonamiento etiquetado y de la coincidencia de modelo moderno, mientras que la
  familia de streams `google-thinking` es propietaria de la normalización de cargas de pensamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para formateo de tokens, análisis de tokens y cableado del endpoint de cuota.
- Anthropic Vertex usa `buildReplayPolicy` a través de la
  familia de replay `anthropic-by-model` para que la limpieza de replay específica de Claude siga estando
  limitada a ids de Claude en lugar de a todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveDefaultThinkingLevel` porque es propietario
  de la clasificación específica de Bedrock de errores de limitación/no listo/overflow de contexto
  para tráfico Anthropic-en-Bedrock; su política de replay sigue compartiendo la misma protección
  `anthropic-by-model` solo para Claude.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de replay `passthrough-gemini` porque sirven de proxy para
  modelos Gemini a través de transportes compatibles con OpenAI y necesitan
  saneamiento de firmas de pensamiento de Gemini sin validación nativa de replay de Gemini ni reescrituras de bootstrap.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de replay `hybrid-anthropic-openai` porque un proveedor es propietario tanto de la semántica de
  mensajes Anthropic como de OpenAI-compatible; mantiene la eliminación de bloques de pensamiento
  solo de Claude en el lado Anthropic mientras sustituye el modo de salida de razonamiento de vuelta a nativo,
  y la familia de streams `minimax-fast-mode` es propietaria de las reescrituras de modelos en fast mode sobre la ruta compartida de stream.
- Moonshot usa `catalog` además de `wrapStreamFn` porque sigue usando el transporte
  compartido de OpenAI pero necesita normalización de carga de pensamiento propiedad del proveedor; la
  familia de streams `moonshot-thinking` asigna configuración más estado `/think` a su carga nativa de pensamiento binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita headers de solicitud propiedad del proveedor,
  normalización de cargas de razonamiento, pistas de transcripción de Gemini y control de TTL de caché de Anthropic;
  la familia de streams `kilocode-thinking` mantiene la inyección de pensamiento de Kilo
  en la ruta compartida de stream proxy, saltándose `kilo/auto` y otros ids de modelos proxy
  que no admiten cargas explícitas de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque es propietario del fallback de GLM-5,
  de los valores predeterminados de `tool_stream`, la UX de pensamiento binario,
  la coincidencia de modelo moderno y tanto la autenticación de uso como la obtención de cuotas; la
  familia de streams `tool-stream-default-on` mantiene el envoltorio `tool_stream` activado por defecto fuera del pegamento manuscrito por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque es propietario de la normalización nativa del transporte xAI Responses, de las reescrituras de alias de Grok fast-mode,
  de `tool_stream` predeterminado, de la limpieza estricta de herramientas / cargas de razonamiento,
  de la reutilización de autenticación de fallback para herramientas propiedad del plugin, de la resolución
  de compatibilidad futura de modelos Grok y de parches de compatibilidad propiedad del proveedor como el perfil
  de schema de herramientas xAI, palabras clave de schema no compatibles, `web_search` nativa y decodificación
  de argumentos de llamadas a herramientas con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities`
  para mantener fuera del núcleo peculiaridades de transcripción/herramientas.
- Los proveedores empaquetados solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto más registros compartidos de comprensión de medios
  y generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` además de hooks de uso porque su comportamiento `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose a través de transportes compartidos.

## Asistentes de tiempo de ejecución

Los plugins pueden acceder a asistentes seleccionados del núcleo mediante `api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Notas:

- `textToSpeech` devuelve la carga de salida normal de TTS del núcleo para superficies de archivo/nota de voz.
- Usa la configuración central `messages.tts` y la selección de proveedor.
- Devuelve búfer de audio PCM + tasa de muestreo. Los plugins deben remuestrear/codificar para proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos como etiquetas de idioma, género y personalidad para selectores conscientes del proveedor.
- OpenAI y ElevenLabs admiten telefonía hoy. Microsoft no.

Los plugins también pueden registrar proveedores de voz mediante `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Notas:

- Mantén en el núcleo la política de TTS, el fallback y la entrega de respuestas.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un proveedor puede ser propietario de
  texto, voz, imagen y futuros proveedores de medios conforme OpenClaw añada esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un proveedor tipado
de comprensión de medios en lugar de un conjunto genérico de clave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notas:

- Mantén en el núcleo la orquestación, el fallback, la configuración y el cableado de canales.
- Mantén el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe mantenerse tipada: nuevos métodos opcionales, nuevos campos
  opcionales de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el núcleo es propietario del contrato de capacidad y del asistente de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para asistentes de tiempo de ejecución de comprensión de medios, los plugins pueden llamar a:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Para transcripción de audio, los plugins pueden usar el tiempo de ejecución de comprensión
de medios o el alias STT más antiguo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional cuando el MIME no puede inferirse de forma fiable:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración central de audio para comprensión de medios (`tools.media.audio`) y el orden de fallback de proveedores.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los plugins también pueden lanzar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Notas:

- `provider` y `model` son sustituciones opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de sustitución para llamadores de confianza.
- Para ejecuciones de fallback propiedad del plugin, los operadores deben habilitarlas con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir plugins de confianza a destinos canónicos concretos `provider/model`, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de sustitución se rechazan en lugar de recurrir silenciosamente a fallback.

Para búsqueda web, los plugins pueden consumir el asistente compartido de tiempo de ejecución en lugar de
acceder al cableado de herramientas del agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Los plugins también pueden registrar proveedores de búsqueda web mediante
`api.registerWebSearchProvider(...)`.

Notas:

- Mantén en el núcleo la selección de proveedor, resolución de credenciales y semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del envoltorio de herramientas del agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera una imagen usando la cadena configurada de proveedores de generación de imágenes.
- `listProviders(...)`: enumera los proveedores disponibles de generación de imágenes y sus capacidades.

## Rutas HTTP de la gateway

Los plugins pueden exponer endpoints HTTP con `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos de la ruta:

- `path`: ruta bajo el servidor HTTP de la gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir la autenticación normal de la gateway, o `"plugin"` para autenticación/validación de webhooks gestionada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin sustituya su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta manejó la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede sustituir la ruta de otro plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Son para webhooks/validación de firmas gestionados por plugins, no para llamadas privilegiadas a asistentes de Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitud de Gateway, pero ese ámbito es intencionadamente conservador:
  - la autenticación bearer por secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de tiempo de ejecución de rutas de plugin fijados en `operator.write`, incluso si quien llama envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el header está presente explícitamente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de plugin con identidad, el ámbito de tiempo de ejecución recurre a `operator.write`
- Regla práctica: no asumas que una ruta de plugin con auth de gateway es una superficie de administración implícita. Si tu ruta necesita comportamiento solo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del header `x-openclaw-scopes`.

## Rutas de importación del SDK de plugins

Usa subrutas del SDK en lugar de la importación monolítica `openclaw/plugin-sdk` al
crear plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugins.
- `openclaw/plugin-sdk/core` para el contrato genérico compartido orientado a plugins.
- `openclaw/plugin-sdk/config-schema` para la exportación del schema Zod raíz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estables de canal como `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` y
  `openclaw/plugin-sdk/webhook-ingress` para el cableado compartido de configuración/auth/respuesta/webhook.
  `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  formateo de sobres y asistentes de contexto de sobres entrantes.
  `channel-setup` es la costura estrecha de configuración de instalación opcional.
  `setup-runtime` es la superficie de configuración segura en tiempo de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores seguros de importación para parches de configuración.
  `setup-adapter-runtime` es la costura de adaptador de configuración de cuentas consciente del entorno.
  `setup-tools` es la pequeña costura de asistentes para CLI/archivos/documentación (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subrutas de dominio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` y
  `openclaw/plugin-sdk/directory-runtime` para asistentes compartidos de tiempo de ejecución/configuración.
  `telegram-command-config` es la costura pública estrecha para normalización/validación
  de comandos personalizados de Telegram y sigue disponible incluso si la superficie de contrato empaquetada de
  Telegram no está disponible temporalmente.
  `text-runtime` es la costura compartida de texto/Markdown/logging, incluida
  la eliminación de texto visible para el asistente, asistentes de renderizado/fragmentación de Markdown, asistentes
  de redacción, asistentes de etiquetas de directiva y utilidades de texto seguro.
- Las costuras de canal específicas de aprobaciones deben preferir un único contrato
  `approvalCapability` en el plugin. Luego el núcleo lee la autenticación, entrega, renderizado y
  comportamiento de enrutamiento nativo de aprobaciones a través de esa única capacidad en lugar de mezclar
  comportamiento de aprobaciones en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está deprecado y permanece solo como
  shim de compatibilidad para plugins antiguos. El código nuevo debe importar las primitivas genéricas
  más estrechas, y el código del repositorio no debe añadir nuevas importaciones del
  shim.
- Los elementos internos de extensiones empaquetadas siguen siendo privados. Los plugins externos deben usar solo subrutas `openclaw/plugin-sdk/*`. El código/pruebas del núcleo de OpenClaw puede usar los puntos de entrada
  públicos del repositorio bajo la raíz de un paquete de plugin como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos estrechamente acotados como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el núcleo ni desde
  otra extensión.
- División del punto de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barril de asistentes/tipos,
  `<plugin-package-root>/runtime-api.js` es el barril solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es la entrada del plugin empaquetado,
  y `<plugin-package-root>/setup-entry.js` es la entrada del plugin de configuración.
- Ejemplos actuales de proveedores empaquetados:
  - Anthropic usa `api.js` / `contract-api.js` para asistentes de stream de Claude como
    `wrapAnthropicProviderStream`, asistentes de headers beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para builders de proveedor, asistentes de modelo predeterminado y builders de proveedor en tiempo real.
  - OpenRouter usa `api.js` para su builder de proveedor más asistentes de onboarding/configuración,
    mientras que `register.runtime.js` aún puede reexportar asistentes genéricos de
    `plugin-sdk/provider-stream` para uso local del repositorio.
- Los puntos de entrada públicos cargados por fachada prefieren la instantánea de configuración activa de tiempo de ejecución
  cuando existe, y luego recurren al archivo de configuración resuelto en disco cuando
  OpenClaw todavía no está sirviendo una instantánea de tiempo de ejecución.
- Las primitivas compartidas genéricas siguen siendo el contrato público preferido del SDK. Aún existe un pequeño conjunto
  reservado de costuras auxiliares con marca de canal empaquetado por compatibilidad. Trátalas como costuras
  de mantenimiento/compatibilidad de empaquetados, no como nuevos destinos de importación para terceros; los nuevos contratos transcanal deben seguir llegando a subrutas genéricas `plugin-sdk/*` o a los barriles locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barril raíz `openclaw/plugin-sdk` para código nuevo.
- Prefiere primero las primitivas estables más estrechas. Las subrutas más nuevas de configuración/emparejamiento/respuesta/
  feedback/contrato/entrada/hilos/comando/secret-input/webhook/infra/
  lista de permitidos/estado/herramienta de mensajes son el contrato previsto para nuevo trabajo
  en plugins empaquetados y externos.
  El análisis/coincidencia de objetivos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las puertas de acciones de mensajes y los asistentes de message-id para reacciones pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barriles auxiliares específicos de extensiones empaquetadas no son estables por defecto. Si un
  asistente solo lo necesita una extensión empaquetada, mantenlo detrás de la costura local `api.js` o `runtime-api.js`
  de esa extensión en lugar de promocionarlo a `openclaw/plugin-sdk/<extension>`.
- Las nuevas costuras de asistentes compartidos deben ser genéricas, no con marca de canal. El análisis de objetivos
  compartido pertenece a `openclaw/plugin-sdk/channel-targets`; los
  elementos internos específicos de canal se mantienen detrás de la costura local `api.js` o `runtime-api.js`
  del plugin propietario.
- Las subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` existen porque los plugins empaquetados/nativos las usan hoy. Su presencia no significa por sí sola que cada asistente exportado sea un contrato externo congelado a largo plazo.

## Schemas de herramientas de mensajes

Los plugins deben ser propietarios de las contribuciones específicas de canal al schema `describeMessageTool(...)`.
Mantén los campos específicos del proveedor dentro del plugin, no en el núcleo compartido.

Para fragmentos de schema compartidos y portables, reutiliza los asistentes genéricos exportados mediante
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para cargas de estilo cuadrícula de botones
- `createMessageToolCardSchema()` para cargas estructuradas de tarjetas

Si una forma de schema solo tiene sentido para un proveedor, defínela en el propio
código fuente de ese plugin en lugar de promocionarla al SDK compartido.

## Resolución de objetivos de canal

Los plugins de canal deben ser propietarios de la semántica específica de objetivos de canal. Mantén
genérico el host saliente compartido y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un objetivo normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en el directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al núcleo si una entrada
  debe saltar directamente a resolución tipo id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando
  el núcleo necesita una resolución final propiedad del proveedor tras la normalización o después de un fallo en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción de rutas de sesión específicas del proveedor una vez resuelto un objetivo.

Separación recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para una búsqueda amplia en directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JIDs, handles e ids de sala dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los asistentes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de MD guiados por lista de permitidos
- mapas configurados de canal/grupo
- fallbacks estáticos de directorio con ámbito de cuenta

Los asistentes compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- asistentes de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección específica del canal de cuentas y la normalización de ids deben permanecer en la implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el plugin sea propietario de ids de modelo específicos del proveedor, valores predeterminados
de base URL o metadatos de modelo protegidos por autenticación.

`catalog.order` controla cuándo se combina el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples guiados por API key o entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de claves, así que los plugins pueden
sustituir intencionadamente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran tanto `catalog` como `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápido cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos doctor/config
  de reparación no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores brutos de tokens solo para informar de disponibilidad de solo lectura.
  Devolver `tokenStatus: "available"` (y el campo de origen correspondiente) es suficiente
  para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta actual del comando.

Eso permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando”
en lugar de fallar o informar erróneamente que la cuenta no está configurada.

## Paquetes pack

Un directorio de plugin puede incluir un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un plugin. Si el pack lista varias extensiones, el id
del plugin pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver symlinks. Las entradas que escapen del directorio del paquete se rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias del plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida ni dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del plugin como “JS/TS puro” y evita paquetes que requieran compilaciones en `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero aún no configurado, carga `setupEntry`
en lugar de la entrada completa del plugin. Esto mantiene más ligero el inicio y la configuración
cuando la entrada principal del plugin también conecta herramientas, hooks u otro código solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por la misma ruta `setupEntry` durante la fase
de inicio previa a la escucha de la gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra por completo la superficie de inicio que debe existir
antes de que la gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que la gateway comience a escuchar
- cualquier método de gateway, herramienta o servicio que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de cualquier capacidad requerida al inicio, no habilites
esta flag. Mantén el plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales empaquetados también pueden publicar asistentes de superficie de contrato solo de configuración que el núcleo
puede consultar antes de cargar el tiempo de ejecución completo del canal. La superficie actual de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El núcleo usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única a
`channels.<id>.accounts.*` sin cargar la entrada completa del plugin.
Matrix es el ejemplo empaquetado actual: mueve solo claves de autenticación/bootstrap a una
cuenta nombrada promovida cuando ya existen cuentas nombradas, y puede preservar una
clave configurada de cuenta predeterminada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parches de configuración mantienen diferido el descubrimiento de superficies de contrato empaquetadas. El tiempo
de importación se mantiene ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal empaquetado durante la importación del módulo.

Cuando esas superficies de inicio incluyen métodos RPC de la gateway, mantenlas en un
prefijo específico del plugin. Los espacios de nombres de administración del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
a `operator.admin`, aunque un plugin solicite un ámbito más estrecho.

Ejemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadatos de catálogo de canal

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
pistas de instalación mediante `openclaw.install`. Esto mantiene el catálogo central libre de datos.

Ejemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos útiles de `openclaw.channel` más allá del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: sustituye el texto del enlace a la documentación
- `preferOver`: ids de plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para superficies de selección
- `markdownCapable`: marca el canal como capaz de Markdown para decisiones de formateo saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración/configure cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal opte por el flujo estándar rápido `allowFrom`
- `forceAccountBinding`: requiere enlace explícito de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda por sesión al resolver objetivos de anuncio

OpenClaw también puede combinar **catálogos de canal externos** (por ejemplo, una exportación
de registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O apunta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados para la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto son propietarios de la orquestación del contexto de sesión para ingestión, ensamblaje
y compactación. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Úsalo cuando tu plugin necesite reemplazar o ampliar el canal predeterminado de contexto
en lugar de simplemente añadir búsqueda en memoria o hooks.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si tu motor **no** es propietario del algoritmo de compactación, mantén `compact()`
implementado y delega explícitamente:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Añadir una nueva capacidad

Cuando un plugin necesite un comportamiento que no encaje en la API actual, no eludas
el sistema de plugins con un acceso privado interno. Añade la capacidad que falta.

Secuencia recomendada:

1. define el contrato central
   Decide qué comportamiento compartido debe ser propiedad del núcleo: política, fallback, combinación de configuración,
   ciclo de vida, semántica orientada a canales y forma del asistente de tiempo de ejecución.
2. añade superficies tipadas de registro/tiempo de ejecución de plugins
   Extiende `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña y útil.
3. conecta consumidores del núcleo + canal/función
   Los canales y plugins de funciones deben consumir la nueva capacidad a través del núcleo,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedor
   Luego los plugins de proveedor registran sus backends contra la capacidad.
5. añade cobertura de contrato
   Añade pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw mantiene una opinión fuerte sin quedar codificado rígidamente a la visión
del mundo de un solo proveedor. Consulta el [Recetario de capacidades](/es/plugins/architecture)
para una lista concreta de archivos y un ejemplo práctico.

### Lista de comprobación de capacidades

Cuando añadas una nueva capacidad, la implementación normalmente debe tocar juntas estas
superficies:

- tipos de contrato central en `src/<capability>/types.ts`
- runner/asistente de tiempo de ejecución central en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de función/canal necesiten consumirla
- asistentes de captura/prueba en `src/test-utils/plugin-registration.ts`
- afirmaciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta alguna de esas superficies, normalmente es una señal de que la capacidad aún
no está integrada por completo.

### Plantilla de capacidad

Patrón mínimo:

```ts
// contrato central
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// asistente compartido de tiempo de ejecución para plugins de función/canal
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene simple la regla:

- el núcleo es propietario del contrato de capacidad + orquestación
- los plugins de proveedor son propietarios de las implementaciones del proveedor
- los plugins de función/canal consumen asistentes de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
