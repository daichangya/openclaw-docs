---
read_when:
    - Compilar o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de plugins o los límites de propiedad
    - Trabajar en la canalización de carga de plugins o en el registro
    - Implementar hooks de tiempo de ejecución del proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Internos de plugins: modelo de capacidades, propiedad, contratos, canalización de carga y asistentes de tiempo de ejecución'
title: Internos de plugins
x-i18n:
    generated_at: "2026-04-12T05:11:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6165a9da8b40de3bb7334fcb16023da5515deb83c4897ca1df1726f4a97db9e0
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de plugins

<Info>
  Esta es la **referencia de arquitectura profunda**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía de usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de plugins
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Descripción general del SDK](/es/plugins/sdk-overview) — mapa de importaciones y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **plugins nativos** dentro de OpenClaw. Cada
plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad             | Método de registro                              | Plugins de ejemplo                   |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferencia de texto   | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend de inferencia de CLI | `api.registerCliBackend(...)`           | `openai`, `anthropic`                |
| Voz                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                     |
| Voz en tiempo real    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensión de medios | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generación de música  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generación de video   | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Obtención web         | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Búsqueda web          | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canal / mensajería    | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas o
servicios es un plugin **heredado solo de hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está incorporado en el core y es usado por plugins
agrupados/nativos hoy en día, pero la compatibilidad de los plugins externos aún necesita un criterio más estricto que “está
exportado, por lo tanto está congelado”.

Guía actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trátalo
  como la línea base de compatibilidad
- **nuevos plugins agrupados/nativos:** prefiere el registro explícito de capacidades en lugar de
  accesos específicos de proveedor o nuevos diseños solo de hooks
- **plugins externos que adopten el registro de capacidades:** está permitido, pero trata las
  superficies auxiliares específicas de capacidades como evolutivas, a menos que la documentación marque explícitamente un
  contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la ruta más segura para evitar incompatibilidades para los plugins externos durante
  la transición
- no todos los subpaths auxiliares exportados son iguales; prefiere el contrato documentado y acotado, no exportaciones auxiliares incidentales

### Formas de plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro (no solo según metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra múltiples tipos de capacidad (por ejemplo,
  `openai` es propietario de la inferencia de texto, voz, comprensión de medios y generación
  de imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios
- **non-capability** -- registra herramientas, comandos, servicios o rutas, pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma y el desglose de capacidades
de un plugin. Consulta la [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para
plugins solo de hooks. Los plugins heredados del mundo real siguen dependiendo de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de reemplazo de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación de prompts
- eliminarlo solo después de que baje el uso real y la cobertura de fixtures demuestre la seguridad de la migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configuración se analiza correctamente y los plugins se resuelven |
| **compatibility advisory** | El plugin usa un patrón compatible pero antiguo (p. ej., `hook-only`) |
| **legacy warning**        | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | La configuración no es válida o el plugin no pudo cargarse   |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy --
`hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Descripción general de la arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifest + descubrimiento**
   OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces del workspace,
   raíces globales de extensiones y extensiones agrupadas. El descubrimiento lee primero los manifests nativos
   `openclaw.plugin.json` junto con los manifests de bundles compatibles.
2. **Habilitación + validación**
   El core decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un slot exclusivo como memory.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan dentro del proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficies**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedor,
   hooks, rutas HTTP, comandos de CLI y servicios.

Específicamente para la CLI de plugins, el descubrimiento de comandos raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo real de la CLI del plugin puede permanecer diferido y registrarse en la primera invocación

Eso mantiene el código de CLI propiedad del plugin dentro del plugin, mientras permite que OpenClaw
reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento y la validación de configuración deben funcionar a partir de **metadatos de manifest/esquema**
  sin ejecutar código del plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin

Esa división permite que OpenClaw valide la configuración, explique plugins faltantes o deshabilitados, y
construya pistas de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la herramienta de mensajes compartida

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una única herramienta `message` compartida en el core, y
los plugins de canal son propietarios del descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el core es propietario del host de la herramienta `message` compartida, la integración con prompts, el
  mantenimiento de sesiones/hilos y el despacho de ejecución
- los plugins de canal son propietarios del descubrimiento de acciones por alcance, el descubrimiento de capacidades y cualquier
  fragmento de esquema específico del canal
- los plugins de canal son propietarios de la gramática de conversación de sesión específica del proveedor, como
  cómo los ID de conversación codifican los ID de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final a través de su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada de descubrimiento unificada
permite que un plugin devuelva juntas sus acciones visibles, capacidades y contribuciones de esquema
para que esas piezas no se desincronicen.

El core pasa el alcance de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensaje según la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante, sin codificar ramas específicas del canal en la herramienta `message` del
core.

Por eso los cambios de enrutamiento del embedded-runner siguen siendo trabajo del plugin: el runner es
responsable de reenviar la identidad actual del chat/sesión al límite de descubrimiento del plugin para que la
herramienta `message` compartida exponga la superficie propiedad del canal correcta para el turno actual.

Para los asistentes de ejecución propiedad del canal, los plugins agrupados deben mantener el tiempo de ejecución
de ejecución dentro de sus propios módulos de extensión. El core ya no es propietario de los
tiempos de ejecución de acciones de mensaje de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subpaths separados `plugin-sdk/*-action-runtime`, y los plugins agrupados
deben importar directamente su propio código de tiempo de ejecución local desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a los seams del SDK con nombre de proveedor en general: el core no
debe importar barriles de conveniencia específicos del canal para Slack, Discord, Signal,
WhatsApp o extensiones similares. Si el core necesita un comportamiento, debe consumir el
propio barril `api.ts` / `runtime-api.ts` del plugin agrupado o promover esa necesidad
a una capacidad genérica y acotada en el SDK compartido.

Específicamente para las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para canales que encajan en el modelo común
  de encuestas
- `actions.handleAction("poll")` es la ruta preferida para la semántica de encuestas específica del canal o parámetros adicionales de encuestas

El core ahora difiere el análisis compartido de encuestas hasta después de que el despacho de encuestas del plugin rechace
la acción, de modo que los controladores de encuestas propiedad del plugin puedan aceptar campos de encuesta específicos del canal sin quedar
bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un plugin nativo como el límite de propiedad de una **empresa** o una
**función**, no como un conjunto de integraciones no relacionadas.

Eso significa:

- un plugin de empresa normalmente debe ser propietario de todas las
  superficies de OpenClaw orientadas a esa empresa
- un plugin de función normalmente debe ser propietario de la superficie completa de la función que introduce
- los canales deben consumir capacidades compartidas del core en lugar de volver a implementar
  comportamiento de proveedor de forma ad hoc

Ejemplos:

- el plugin agrupado `openai` es propietario del comportamiento del proveedor de modelos de OpenAI y del comportamiento de OpenAI
  de voz + voz en tiempo real + comprensión de medios + generación de imágenes
- el plugin agrupado `elevenlabs` es propietario del comportamiento de voz de ElevenLabs
- el plugin agrupado `microsoft` es propietario del comportamiento de voz de Microsoft
- el plugin agrupado `google` es propietario del comportamiento del proveedor de modelos de Google más el comportamiento de Google
  de comprensión de medios + generación de imágenes + búsqueda web
- el plugin agrupado `firecrawl` es propietario del comportamiento de obtención web de Firecrawl
- los plugins agrupados `minimax`, `mistral`, `moonshot` y `zai` son propietarios de sus
  backends de comprensión de medios
- el plugin agrupado `qwen` es propietario del comportamiento del proveedor de texto de Qwen más el
  comportamiento de comprensión de medios y generación de video
- el plugin `voice-call` es un plugin de función: es propietario del transporte de llamadas, herramientas,
  CLI, rutas y el puente de flujo de medios de Twilio, pero consume capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedor

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia área de superficie
- los canales no se preocupan por qué plugin del proveedor es propietario del proveedor; consumen el
  contrato de capacidad compartida expuesto por el core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del core que múltiples plugins pueden implementar o consumir

Así que, si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debería codificar el manejo de video de forma rígida?” La primera pregunta es “¿cuál es
el contrato de capacidad de video del core?” Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse en él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, el movimiento correcto suele ser:

1. definir la capacidad faltante en el core
2. exponerla a través de la API/tiempo de ejecución del plugin de forma tipada
3. conectar canales/funciones a esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene la propiedad explícita y evita al mismo tiempo que el comportamiento del core dependa de un
único proveedor o de una ruta de código específica de un plugin puntual.

### Capas de capacidades

Usa este modelo mental al decidir dónde debe estar el código:

- **capa de capacidades del core**: orquestación compartida, política, fallback, reglas
  de combinación de configuración, semántica de entrega y contratos tipados
- **capa de plugins de proveedor**: APIs específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, futuros backends de video, endpoints de uso
- **capa de plugins de canal/función**: integración con Slack/Discord/voice-call/etc.
  que consume capacidades del core y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el core es propietario de la política de TTS en el momento de la respuesta, el orden de fallback, las preferencias y la entrega por canal
- `openai`, `elevenlabs` y `microsoft` son propietarios de las implementaciones de síntesis
- `voice-call` consume el asistente de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para futuras capacidades.

### Ejemplo de plugin de empresa con múltiples capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios,
generación de imágenes, generación de video, obtención web y búsqueda web,
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
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de los asistentes. Lo que importa es la forma:

- un solo plugin es propietario de la superficie del proveedor
- el core sigue siendo propietario de los contratos de capacidad
- los plugins de canal y de función consumen asistentes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades de las que
  dice ser propietario

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una capacidad compartida.
El mismo modelo de propiedad se aplica ahí:

1. el core define el contrato de comprensión de medios
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y de función consumen el comportamiento compartido del core en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el core los supuestos de video de un proveedor. El plugin es propietario de
la superficie del proveedor; el core es propietario del contrato de capacidad y del comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el core es propietario del contrato tipado de
capacidad y del asistente de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` en él.

¿Necesitas una lista de despliegue concreta? Consulta
[Recetario de capacidades](/es/plugins/architecture).

## Contratos y cumplimiento

La superficie de la API de plugins es intencionadamente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los asistentes de tiempo de ejecución en los que un plugin puede apoyarse.

Por qué importa esto:

- los autores de plugins obtienen un estándar interno estable
- el core puede rechazar propiedad duplicada, como dos plugins que registran el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros malformados
- las pruebas de contrato pueden aplicar la propiedad de plugins agrupados y evitar desvíos silenciosos

Hay dos capas de cumplimiento:

1. **cumplimiento de registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos:
   id de proveedor duplicados, id de proveedor de voz duplicados y registros
   malformados producen diagnósticos de plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins agrupados se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar explícitamente la propiedad. Hoy esto se usa para
   proveedores de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registro agrupado.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin es propietario de qué
superficie. Eso permite que el core y los canales se compongan sin fricciones porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de capacidades
- propiedad del core
- reutilizables por múltiples plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica del proveedor oculta en el core
- vías de escape puntuales de plugins que evitan el registro
- código de canal que entra directamente en una implementación del proveedor
- objetos ad hoc de tiempo de ejecución que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **dentro del proceso** con el Gateway. No están
aislados. Un plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del core.

Implicaciones:

- un plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un error en un plugin nativo puede bloquear o desestabilizar el gateway
- un plugin nativo malicioso equivale a ejecución arbitraria de código dentro
  del proceso de OpenClaw

Los bundles compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente
Skills agrupadas.

Usa allowlists y rutas explícitas de instalación/carga para plugins no agrupados. Trata
los plugins del workspace como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes agrupados del workspace, mantén el id del plugin anclado al nombre
de npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionadamente un rol de plugin más acotado.

Nota importante sobre confianza:

- `plugins.allow` confía en **ids de plugin**, no en la procedencia del origen.
- Un plugin del workspace con el mismo id que un plugin agrupado sombrea intencionadamente
  la copia agrupada cuando ese plugin del workspace está habilitado/en la allowlist.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencias de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no sean contratos:

- subpaths auxiliares específicos de plugins agrupados
- subpaths de plomería de tiempo de ejecución no pensados como API pública
- asistentes de conveniencia específicos del proveedor
- asistentes de configuración/incorporación que son detalles de implementación

Algunos subpaths auxiliares de plugins agrupados aún permanecen en el mapa generado de exportación del SDK
por compatibilidad y mantenimiento de plugins agrupados. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varios seams `plugin-sdk/matrix*`. Trátalos como
exportaciones reservadas de detalle de implementación, no como el patrón de SDK recomendado para
nuevos plugins de terceros.

## Canalización de carga

Al iniciar, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifests nativos o de bundles compatibles y metadatos de paquetes
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación de cada candidato
6. carga módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila los registros en el registro de plugins
8. expone el registro a las superficies de comandos/tiempo de ejecución

<Note>
`activate` es un alias heredado de `register`: el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins agrupados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las puertas de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del plugin, la ruta es editable por cualquiera o la
propiedad de la ruta parece sospechosa para plugins no agrupados.

### Comportamiento centrado en el manifest

El manifest es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades del bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- preservar descriptores económicos de activación y configuración sin cargar el tiempo de ejecución del plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real como hooks, herramientas, comandos o flujos de proveedor.

Los bloques opcionales `activation` y `setup` del manifest permanecen en el plano de control.
Son descriptores solo de metadatos para la planificación de activación y el descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.

El descubrimiento de configuración ahora prefiere ids propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar plugins candidatos antes de volver a `setup-api` para plugins que aún necesitan hooks de tiempo de ejecución en configuración. Si más de
un plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend de CLI, la búsqueda de configuración rechaza al propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés cortas dentro del proceso para:

- resultados de descubrimiento
- datos del registro de manifests
- registros de plugins cargados

Estas cachés reducen el inicio con ráfagas y la sobrecarga de comandos repetidos. Es seguro
pensar en ellas como cachés de rendimiento de corta duración, no como persistencia.

Nota de rendimiento:

- Establece `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desactivar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no mutan directamente globals aleatorios del core. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, origen, procedencia, estado, diagnósticos)
- herramientas
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC del gateway
- rutas HTTP
- registradores de CLI
- servicios en segundo plano
- comandos propiedad del plugin

Luego, las funciones del core leen desde ese registro en lugar de hablar con los módulos de plugins
directamente. Esto mantiene la carga en una sola dirección:

- módulo del plugin -> registro en el registro
- tiempo de ejecución del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: “leer el registro”, no “hacer un caso especial para cada módulo
de plugin”.

## Callbacks de asociación de conversaciones

Los plugins que asocian una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de asociación sea aprobada o denegada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos de la carga útil del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: la asociación resuelta para solicitudes aprobadas
- `request`: el resumen de la solicitud original, sugerencia de desvinculación, id del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién tiene permitido asociar una
conversación, y se ejecuta después de que termine el manejo de aprobación del core.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifest: `providerAuthEnvVars` para búsquedas económicas de autenticación del proveedor mediante variables de entorno
  antes de cargar el tiempo de ejecución, `providerAuthAliases` para variantes de proveedor que comparten
  autenticación, `channelEnvVars` para búsquedas económicas de entorno/configuración del canal antes de la carga del tiempo de ejecución,
  además de `providerAuthChoices` para etiquetas económicas de incorporación/opciones de autenticación y
  metadatos de flags de CLI antes de cargar el tiempo de ejecución
- hooks en tiempo de configuración: `catalog` / `discovery` heredado más `applyConfigDefaults`
- hooks de tiempo de ejecución: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
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

OpenClaw sigue siendo propietario del bucle genérico del agente, failover, manejo de
transcripciones y política de herramientas. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar todo un transporte de inferencia personalizado.

Usa el manifest `providerAuthEnvVars` cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelos deban ver sin cargar el tiempo de ejecución del plugin.
Usa el manifest `providerAuthAliases` cuando un id de proveedor deba reutilizar
las variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y la opción de incorporación con clave API
de otro id de proveedor. Usa el manifest `providerAuthChoices` cuando las
superficies de CLI de incorporación/opción de autenticación deban conocer el id de opción del proveedor, las etiquetas de grupo y la lógica
simple de autenticación con un solo flag sin cargar el tiempo de ejecución del proveedor. Mantén `envVars` del tiempo de ejecución del proveedor para sugerencias orientadas al operador, como etiquetas de incorporación o variables de
configuración de client-id/client-secret de OAuth.

Usa el manifest `channelEnvVars` cuando un canal tenga autenticación o configuración impulsada por variables de entorno que
los mecanismos genéricos de fallback del entorno de shell, verificaciones de config/status o prompts de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden y uso de hooks

Para plugins de modelo/proveedor, OpenClaw llama a los hooks aproximadamente en este orden.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`           | El proveedor es propietario de un catálogo o de valores predeterminados de URL base                                                        |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de la configuración | Los valores predeterminados dependen del modo de autenticación, del entorno o de la semántica de la familia de modelos del proveedor      |
| --  | _(búsqueda de modelos integrados)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un hook de plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza aliases heredados o de vista previa de id de modelo antes de la búsqueda                            | El proveedor es propietario de la limpieza de aliases antes de la resolución canónica del modelo                                           |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblado genérico del modelo             | El proveedor es propietario de la limpieza del transporte para ids de proveedor personalizados dentro de la misma familia de transporte    |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución del proveedor/en tiempo de ejecución                 | El proveedor necesita una limpieza de configuración que deba vivir con el plugin; los asistentes agrupados de la familia Google también respaldan las entradas compatibles de configuración de Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de streaming nativo a los proveedores de configuración           | El proveedor necesita correcciones de metadatos de uso de streaming nativo basadas en endpoints                                            |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación por marcador de entorno para proveedores de configuración antes de cargar la autenticación en tiempo de ejecución | El proveedor tiene resolución de clave API por marcador de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcador de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada por uno mismo o respaldada por configuración sin persistir texto sin formato | El proveedor puede operar con un marcador de credencial sintética/local                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles de autenticación externa propiedad del proveedor; el valor predeterminado de `persistence` es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales de autenticación externas sin persistir tokens de actualización copiados                              |
| 10  | `shouldDeferSyntheticProfileAuth` | Hace que los marcadores de posición de perfiles sintéticos almacenados queden por detrás de la autenticación respaldada por entorno/configuración | El proveedor almacena perfiles de marcador de posición sintéticos que no deberían tener precedencia                                        |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo propiedad del proveedor que todavía no están en el registro local        | El proveedor acepta ids de modelo arbitrarios del upstream                                                                                  |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo                                      | El proveedor necesita metadatos de red antes de resolver ids desconocidos                                                                  |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el embedded runner use el modelo resuelto                                      | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin asumir la propiedad del proveedor                                       |
| 15  | `capabilities`                    | Metadatos de transcripción/herramientas propiedad del proveedor usados por la lógica compartida del core      | El proveedor necesita particularidades de transcripción/familia de proveedor                                                               |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de herramientas antes de que el embedded runner los vea                                    | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                     |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor después de la normalización                            | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                   |
| 18  | `resolveReasoningOutputMode`      | Selecciona el contrato de salida de razonamiento nativo frente al etiquetado                                  | El proveedor necesita salida final/de razonamiento etiquetada en lugar de campos nativos                                                  |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de stream                | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                       |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de stream con un transporte personalizado                               | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                              |
| 21  | `wrapStreamFn`                    | Wrapper de stream después de aplicar los wrappers genéricos                                                   | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados o metadatos nativos por turno del transporte                                              | El proveedor quiere que los transportes genéricos envíen identidad de turno nativa del proveedor                                          |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                 | El proveedor quiere que los transportes genéricos de WS ajusten los encabezados de sesión o la política de fallback                       |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado se convierte en la cadena `apiKey` del tiempo de ejecución | El proveedor almacena metadatos adicionales de autenticación y necesita una forma personalizada del token en tiempo de ejecución          |
| 25  | `refreshOAuth`                    | Reemplazo de actualización de OAuth para endpoints de actualización personalizados o política de fallo de actualización | El proveedor no encaja en los refrescadores compartidos `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación agregada cuando falla la actualización de OAuth                                      | El proveedor necesita orientación de reparación de autenticación propiedad del proveedor tras un fallo de actualización                    |
| 27  | `matchesContextOverflowError`     | Comparador de desbordamiento de ventana de contexto propiedad del proveedor                                   | El proveedor tiene errores de desbordamiento sin procesar que las heurísticas genéricas no detectarían                                    |
| 28  | `classifyFailoverReason`          | Clasificación de razones de failover propiedad del proveedor                                                  | El proveedor puede mapear errores sin procesar de API/transporte a límite de tasa, sobrecarga, etc.                                       |
| 29  | `isCacheTtlEligible`              | Política de caché de prompts para proveedores proxy/backhaul                                                  | El proveedor necesita control de TTL de caché específico de proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Reemplazo del mensaje genérico de recuperación por falta de autenticación                                     | El proveedor necesita una sugerencia de recuperación por falta de autenticación específica del proveedor                                   |
| 31  | `suppressBuiltInModel`            | Supresión de modelos upstream obsoletos más sugerencia opcional de error orientada al usuario                | El proveedor necesita ocultar filas upstream obsoletas o reemplazarlas con una sugerencia del proveedor                                   |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo agregadas después del descubrimiento                                     | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                             |
| 33  | `isBinaryThinking`                | Alternancia de razonamiento activado/desactivado para proveedores de razonamiento binario                    | El proveedor expone solo razonamiento binario activado/desactivado                                                                         |
| 34  | `supportsXHighThinking`           | Compatibilidad con razonamiento `xhigh` para modelos seleccionados                                            | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Nivel predeterminado de `/think` para una familia de modelos específica                                       | El proveedor es propietario de la política predeterminada de `/think` para una familia de modelos                                         |
| 36  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfiles en vivo y selección de smoke                         | El proveedor es propietario de la coincidencia de modelos preferidos para pruebas en vivo/smoke                                           |
| 37  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real del tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                             |
| 38  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies de estado relacionadas                   | El proveedor necesita análisis personalizado de tokens de uso/cuota o una credencial de uso diferente                                      |
| 39  | `fetchUsageSnapshot`              | Obtiene y normaliza snapshots de uso/cuota específicos del proveedor después de resolver la autenticación      | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                            |
| 40  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memory/search                                | El comportamiento de embeddings de memory pertenece al plugin del proveedor                                                                 |
| 41  | `buildReplayPolicy`               | Devuelve una política de replay que controla el manejo de transcripciones para el proveedor                    | El proveedor necesita una política de transcripción personalizada (por ejemplo, eliminación de bloques de razonamiento)                    |
| 42  | `sanitizeReplayHistory`           | Reescribe el historial de replay después de la limpieza genérica de transcripciones                            | El proveedor necesita reescrituras específicas del proveedor para replay más allá de los asistentes compartidos de compactación            |
| 43  | `validateReplayTurns`             | Validación final o remodelado de turnos de replay antes del embedded runner                                    | El transporte del proveedor necesita una validación de turnos más estricta después de la sanitización genérica                            |
| 44  | `onModelSelected`                 | Ejecuta efectos secundarios posteriores a la selección propiedad del proveedor                                 | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo pasa a estar activo                                     |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
plugin de proveedor coincidente y luego recorren el resto de plugins de proveedor con capacidad de hooks
hasta que uno realmente cambia el id del modelo o el transporte/configuración. Eso mantiene
funcionando los shims de alias/proveedor de compatibilidad sin exigir que quien llama sepa qué
plugin agrupado es propietario de la reescritura. Si ningún hook de proveedor reescribe una entrada de configuración compatible
de la familia Google, el normalizador de configuración agrupado de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable totalmente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase distinta de extensión. Estos hooks son para comportamiento de proveedor
que sigue ejecutándose en el bucle de inferencia normal de OpenClaw.

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
  de las sugerencias de familia de proveedor, de la guía de reparación de autenticación, de la integración
  del endpoint de uso, de la elegibilidad de caché de prompts, de los valores predeterminados de configuración conscientes de autenticación, de la política
  predeterminada/adaptativa de pensamiento de Claude y del modelado de stream específico de Anthropic para
  encabezados beta, `/fast` / `serviceTier` y `context1m`.
- Los asistentes de stream específicos de Claude de Anthropic permanecen por ahora en el
  seam público propio `api.ts` / `contract-api.ts` del plugin agrupado. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los builders
  de wrappers de Anthropic de más bajo nivel en lugar de ampliar el SDK genérico en torno a las reglas de encabezados beta de un solo
  proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities`, además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque es propietario de la compatibilidad futura de GPT-5.4, de la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, de las sugerencias de autenticación conscientes de Codex,
  de la supresión de Spark, de las filas sintéticas de lista de OpenAI y de la política de pensamiento/modelo en vivo de GPT-5; la familia de streams `openai-responses-defaults` es propietaria de los wrappers compartidos nativos de OpenAI Responses para encabezados de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  modelado de carga útil compatible con razonamiento y gestión del contexto de Responses.
- OpenRouter usa `catalog`, además de `resolveDynamicModel` y
  `prepareDynamicModel`, porque el proveedor es de paso y puede exponer nuevos
  ids de modelo antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del core los encabezados de solicitud específicos del proveedor, los metadatos de enrutamiento, los parches de razonamiento y
  la política de caché de prompts. Su política de replay proviene de la
  familia `passthrough-gemini`, mientras que la familia de streams `openrouter-thinking`
  es propietaria de la inyección de razonamiento proxy y de las omisiones de modelos no compatibles / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities`, además de `prepareRuntimeAuth` y `fetchUsageSnapshot`, porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de fallback de modelo, particularidades de transcripción de Claude, un intercambio de token de GitHub -> token de Copilot y un endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog`, además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot`, porque
  sigue ejecutándose sobre los transportes centrales de OpenAI, pero es propietario de su normalización de transporte/base URL,
  de la política de fallback de actualización de OAuth, de la elección de transporte predeterminada,
  de las filas sintéticas de catálogo de Codex y de la integración del endpoint de uso de ChatGPT; comparte
  la misma familia de streams `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de replay `google-gemini` es propietaria del fallback de compatibilidad futura de Gemini 3.1,
  de la validación nativa de replay de Gemini, de la sanitización de replay de bootstrap,
  del modo de salida de razonamiento etiquetado y de la coincidencia de modelos modernos, mientras que la
  familia de streams `google-thinking` es propietaria de la normalización de la carga útil de pensamiento de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para el formateo de tokens, el análisis de tokens y la conexión
  del endpoint de cuota.
- Anthropic Vertex usa `buildReplayPolicy` a través de la
  familia de replay `anthropic-by-model` para que la limpieza de replay específica de Claude quede
  acotada a ids de Claude en lugar de a cada transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveDefaultThinkingLevel` porque es propietario
  de la clasificación de errores específicos de Bedrock de limitación/no listo/desbordamiento de contexto
  para tráfico Anthropic-on-Bedrock; su política de replay sigue compartiendo la misma
  protección solo para Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  a través de la familia de replay `passthrough-gemini` porque hacen proxy de modelos Gemini
  mediante transportes compatibles con OpenAI y necesitan
  sanitización de firmas de pensamiento de Gemini sin validación nativa de replay de Gemini ni reescrituras
  de bootstrap.
- MiniMax usa `buildReplayPolicy` a través de la
  familia de replay `hybrid-anthropic-openai` porque un solo proveedor es propietario tanto de semántica
  de mensajes Anthropic como de compatibilidad con OpenAI; mantiene la eliminación de bloques de pensamiento exclusivos de Claude
  en el lado Anthropic mientras reemplaza el modo de salida de razonamiento de vuelta a nativo, y la familia de streams `minimax-fast-mode` es propietaria de las reescrituras de modelos de modo rápido en la ruta de stream compartida.
- Moonshot usa `catalog`, además de `wrapStreamFn`, porque sigue usando el transporte
  compartido de OpenAI pero necesita normalización de carga útil de pensamiento propiedad del proveedor; la
  familia de streams `moonshot-thinking` asigna config más estado `/think` a su
  carga útil nativa de pensamiento binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita encabezados de solicitud propiedad del proveedor,
  normalización de carga útil de razonamiento, sugerencias de transcripción de Gemini y control
  de TTL de caché de Anthropic; la familia de streams `kilocode-thinking` mantiene la inyección
  de pensamiento de Kilo en la ruta de stream proxy compartida mientras omite `kilo/auto` y
  otros ids de modelo proxy que no admiten cargas útiles explícitas de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque es propietario del fallback de GLM-5,
  de los valores predeterminados de `tool_stream`, de la UX de pensamiento binario, de la coincidencia de modelos modernos y tanto
  de la autenticación de uso como de la obtención de cuota; la familia de streams `tool-stream-default-on` mantiene el wrapper predeterminado activado `tool_stream` fuera del pegamento manuscrito por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque es propietario de la normalización nativa de transporte xAI Responses, de las reescrituras de alias de modo rápido de Grok, del valor predeterminado `tool_stream`, de la limpieza estricta de herramientas / carga útil de razonamiento,
  de la reutilización de autenticación de fallback para herramientas propiedad del plugin, de la resolución de modelos Grok con compatibilidad futura
  y de parches de compatibilidad propiedad del proveedor, como el perfil de esquema de herramientas de xAI,
  palabras clave de esquema no compatibles, `web_search` nativo y la decodificación de argumentos de llamadas a herramientas
  con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities` para mantener
  fuera del core las particularidades de transcripción/herramientas.
- Los proveedores agrupados solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto, además de registros compartidos de comprensión de medios y
  generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog`, además de hooks de uso, porque su comportamiento `/usage`
  es propiedad del plugin aunque la inferencia siga ejecutándose a través de los transportes compartidos.

## Asistentes de tiempo de ejecución

Los plugins pueden acceder a asistentes seleccionados del core mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil de salida TTS normal del core para superficies de archivo/nota de voz.
- Usa la configuración del core `messages.tts` y la selección de proveedor.
- Devuelve buffer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Los listados de voces pueden incluir metadatos más ricos como configuración regional, género y etiquetas de personalidad para selectores conscientes del proveedor.
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

- Mantén la política de TTS, el fallback y la entrega de respuestas en el core.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado por empresa: un solo plugin de proveedor puede ser propietario de
  texto, voz, imagen y futuros proveedores de medios a medida que OpenClaw agregue esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un único proveedor tipado
de comprensión de medios en lugar de una bolsa genérica de clave/valor:

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

- Mantén la orquestación, el fallback, la configuración y la conexión con canales en el core.
- Mantén el comportamiento del proveedor en el plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos
  campos opcionales de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el core es propietario del contrato de capacidad y del asistente de tiempo de ejecución
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

Para la transcripción de audio, los plugins pueden usar el tiempo de ejecución de comprensión de medios
o el alias STT anterior:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` es la superficie compartida preferida para
  comprensión de imagen/audio/video.
- Usa la configuración de audio de comprensión de medios del core (`tools.media.audio`) y el orden de fallback del proveedor.
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

- `provider` y `model` son reemplazos opcionales por ejecución, no cambios persistentes de sesión.
- OpenClaw solo respeta esos campos de reemplazo para llamadores de confianza.
- Para ejecuciones de fallback propiedad del plugin, los operadores deben habilitarlo explícitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins de confianza a objetivos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier objetivo.
- Las ejecuciones de subagentes de plugins no confiables siguen funcionando, pero las solicitudes de reemplazo se rechazan en lugar de recurrir silenciosamente al fallback.

Para búsqueda web, los plugins pueden consumir el asistente compartido de tiempo de ejecución en lugar de
entrar en la integración de herramientas del agente:

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

- Mantén en el core la selección de proveedor, la resolución de credenciales y la semántica compartida de solicitudes.
- Usa proveedores de búsqueda web para transportes de búsqueda específicos del proveedor.
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesitan comportamiento de búsqueda sin depender del wrapper de la herramienta del agente.

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
- `listProviders(...)`: enumera los proveedores de generación de imágenes disponibles y sus capacidades.

## Rutas HTTP del Gateway

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

- `path`: ruta bajo el servidor HTTP del gateway.
- `auth`: obligatorio. Usa `"gateway"` para requerir autenticación normal del gateway, o `"plugin"` para autenticación/verificación de webhook administrada por el plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta manejó la solicitud.

Notas:

- `api.registerHttpHandler(...)` fue eliminado y causará un error de carga del plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de plugins deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un plugin no puede reemplazar la ruta de otro plugin.
- Las rutas superpuestas con diferentes niveles de `auth` se rechazan. Mantén las cadenas de continuidad `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente ámbitos de tiempo de ejecución del operador. Son para webhooks/verificación de firmas administrados por el plugin, no para llamadas auxiliares privilegiadas del Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un ámbito de tiempo de ejecución de solicitud del Gateway, pero ese ámbito es intencionalmente conservador:
  - la autenticación bearer de secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los ámbitos de tiempo de ejecución de rutas de plugin fijados en `operator.write`, incluso si quien llama envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente explícitamente
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de plugin con identidad, el ámbito de tiempo de ejecución vuelve a `operator.write`
- Regla práctica: no asumas que una ruta de plugin con autenticación de gateway es implícitamente una superficie de administrador. Si tu ruta necesita comportamiento exclusivo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de plugins

Usa subpaths del SDK en lugar de la importación monolítica `openclaw/plugin-sdk` al
desarrollar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugins.
- `openclaw/plugin-sdk/core` para el contrato genérico compartido orientado a plugins.
- `openclaw/plugin-sdk/config-schema` para la exportación del esquema Zod raíz de `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` para la integración compartida de configuración/autenticación/respuesta/webhook.
  `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  asistentes de política de menciones entrantes, formato de sobres y asistentes de contexto
  de sobres entrantes.
  `channel-setup` es el seam acotado de configuración de instalación opcional.
  `setup-runtime` es la superficie de configuración segura en tiempo de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores de parche de configuración seguros para importación.
  `setup-adapter-runtime` es el seam de adaptador de configuración de cuentas sensible al entorno.
  `setup-tools` es el seam pequeño de asistentes de CLI/archivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpaths de dominio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
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
  `telegram-command-config` es el seam público acotado para la
  normalización/validación de comandos personalizados de Telegram y sigue disponible aunque la
  superficie de contrato agrupada de Telegram no esté disponible temporalmente.
  `text-runtime` es el seam compartido de texto/markdown/logging, que incluye
  eliminación de texto visible para el asistente, asistentes de renderizado/fragmentación de markdown, asistentes de redacción, asistentes de etiquetas de directivas y utilidades de texto seguro.
- Los seams de canal específicos de aprobación deben preferir un único contrato `approvalCapability`
  en el plugin. Luego el core lee autenticación, entrega, renderizado,
  enrutamiento nativo y comportamiento diferido del controlador nativo a través de esa única capacidad
  en lugar de mezclar comportamiento de aprobación en campos no relacionados del plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto y permanece solo como un
  shim de compatibilidad para plugins antiguos. El código nuevo debe importar las primitivas genéricas más acotadas en su lugar, y el código del repo no debe agregar nuevas importaciones del shim.
- Los internos de extensiones agrupadas siguen siendo privados. Los plugins externos deben usar solo
  subpaths `openclaw/plugin-sdk/*`. El código core/de prueba de OpenClaw puede usar los puntos de entrada públicos del repo
  bajo la raíz de un paquete de plugin como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance reducido como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de plugin desde el core ni desde
  otra extensión.
- División de puntos de entrada del repo:
  `<plugin-package-root>/api.js` es el barril de asistentes/tipos,
  `<plugin-package-root>/runtime-api.js` es el barril solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es el punto de entrada del plugin agrupado,
  y `<plugin-package-root>/setup-entry.js` es el punto de entrada del plugin de configuración.
- Ejemplos actuales de proveedores agrupados:
  - Anthropic usa `api.js` / `contract-api.js` para asistentes de stream de Claude como
    `wrapAnthropicProviderStream`, asistentes de encabezados beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para builders de proveedores, asistentes de modelo predeterminado y
    builders de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su builder de proveedor más asistentes de incorporación/configuración,
    mientras `register.runtime.js` puede seguir reexportando asistentes genéricos
    `plugin-sdk/provider-stream` para uso local del repo.
- Los puntos de entrada públicos cargados por fachada prefieren la instantánea de configuración activa de tiempo de ejecución
  cuando existe una; luego recurren al archivo de configuración resuelto en disco cuando
  OpenClaw aún no está sirviendo una instantánea de tiempo de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Aún existe
  un pequeño conjunto de compatibilidad reservado de seams auxiliares de canal con marca agrupada. Trátalos como seams de mantenimiento/compatibilidad agrupados, no como nuevos objetivos de importación para terceros; los nuevos contratos entre canales deben seguir llegando a subpaths genéricos `plugin-sdk/*` o a los barriles locales del plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barril raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables y acotadas. Los subpaths más recientes de configuración/asociación/respuesta/
  feedback/contrato/entrada/hilos/comando/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para trabajo nuevo con
  plugins agrupados y externos.
  El análisis/coincidencia de objetivos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las compuertas de acciones de mensajes y los asistentes de id de mensaje para reacciones pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barriles auxiliares específicos de extensiones agrupadas no son estables de forma predeterminada. Si un
  asistente solo lo necesita una extensión agrupada, mantenlo detrás del seam
  local `api.js` o `runtime-api.js` de la extensión en lugar de promoverlo a
  `openclaw/plugin-sdk/<extension>`.
- Los nuevos seams de asistentes compartidos deben ser genéricos, no de marca de canal. El análisis compartido de
  objetivos pertenece a `openclaw/plugin-sdk/channel-targets`; los internos específicos del canal
  permanecen detrás del seam local `api.js` o `runtime-api.js` del plugin propietario.
- Subpaths específicos de capacidades como `image-generation`,
  `media-understanding` y `speech` existen porque los plugins agrupados/nativos los usan
  hoy. Su presencia no significa por sí sola que cada asistente exportado sea un
  contrato externo congelado a largo plazo.

## Esquemas de la herramienta de mensajes

Los plugins deben ser propietarios de las contribuciones de esquema específicas del canal para
`describeMessageTool(...)`. Mantén los campos específicos del proveedor en el plugin, no en el core compartido.

Para fragmentos de esquema portables compartidos, reutiliza los asistentes genéricos exportados a través de
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para cargas útiles de estilo cuadrícula de botones
- `createMessageToolCardSchema()` para cargas útiles de tarjeta estructurada

Si una forma de esquema solo tiene sentido para un proveedor, defínela en el
propio código fuente de ese plugin en lugar de promoverla al SDK compartido.

## Resolución de objetivos de canal

Los plugins de canal deben ser propietarios de la semántica de objetivos específica del canal. Mantén
genérico el host de salida compartido y usa la superficie del adaptador de mensajería para las reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un objetivo normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` le dice al core si una
  entrada debe ir directamente a resolución tipo id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del plugin cuando el
  core necesita una resolución final propiedad del proveedor tras la normalización o tras un fallo
  en el directorio.
- `messaging.resolveOutboundSessionRoute(...)` es propietario de la construcción específica del proveedor
  de rutas de sesión de salida una vez que se resuelve un objetivo.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes de
  buscar pares/grupos.
- Usa `looksLikeId` para comprobaciones de “tratar esto como un id de objetivo explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén ids nativos del proveedor como ids de chat, ids de hilo, JID, handles e ids de sala
  dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
plugin y reutilizar los asistentes compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Usa esto cuando un canal necesite pares/grupos respaldados por configuración, como:

- pares de DM controlados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de directorio con alcance por cuenta

Los asistentes compartidos de `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- asistentes de deduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección de cuentas específica del canal y la normalización de ids deben permanecer en la
implementación del plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para múltiples entradas de proveedor

Usa `catalog` cuando el plugin sea propietario de ids de modelo específicos del proveedor, valores predeterminados de URL base o metadatos de modelos condicionados por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un plugin en relación con los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores simples con clave API o impulsados por entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan múltiples entradas de proveedor relacionadas
- `late`: pasada final, después de otros proveedores implícitos

Los proveedores posteriores ganan en caso de colisión de claves, por lo que los plugins pueden
reemplazar intencionadamente una entrada de proveedor integrada con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran `catalog` y `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Puede asumir que las credenciales
  están completamente materializadas y puede fallar rápidamente cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de doctor/reparación de configuración
  no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando sea relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores de token sin procesar solo para informar disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo de origen correspondiente) es suficiente para comandos de tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no disponible en la ruta actual del comando.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando”
en lugar de bloquearse o informar incorrectamente que la cuenta no está configurada.

## Paquetes agrupadores

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

Cada entrada se convierte en un plugin. Si el paquete enumera múltiples extensiones, el id del plugin
pasa a ser `name/<fileBase>`.

Si tu plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias de plugins con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias de plugins en “JS/TS puro” y evita paquetes que requieran compilaciones en `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un plugin de canal deshabilitado, o
cuando un plugin de canal está habilitado pero sigue sin configurarse, carga `setupEntry`
en lugar del punto de entrada completo del plugin. Esto hace que el inicio y la configuración sean más ligeros
cuando el punto de entrada principal del plugin también conecta herramientas, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un plugin de canal opte por esa misma ruta `setupEntry` durante la
fase de inicio previa a `listen` del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar todas las capacidades propiedad del canal de las que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método, herramienta o servicio del gateway que deba existir durante esa misma ventana

Si tu entrada completa sigue siendo propietaria de alguna capacidad de inicio requerida, no habilites
este flag. Mantén el plugin con el comportamiento predeterminado y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales agrupados también pueden publicar asistentes de superficie de contrato solo de configuración que el core
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El core usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar el punto de entrada completo del plugin.
Matrix es el ejemplo agrupado actual: mueve solo claves de autenticación/bootstrap a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede preservar una
clave predeterminada configurada no canónica en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen perezoso el descubrimiento de la superficie de contrato agrupada. El tiempo
de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
reingresar al inicio del canal agrupado al importar el módulo.

Cuando esas superficies de inicio incluyen métodos RPC del gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre se resuelven
a `operator.admin`, incluso si un plugin solicita un ámbito más acotado.

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

### Metadatos del catálogo de canales

Los plugins de canal pueden anunciar metadatos de configuración/descubrimiento mediante `openclaw.channel` y
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo del core libre de datos.

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

Campos útiles de `openclaw.channel` además del ejemplo mínimo:

- `detailLabel`: etiqueta secundaria para superficies más ricas de catálogo/estado
- `docsLabel`: reemplaza el texto del enlace para el enlace de documentación
- `preferOver`: ids de plugin/canal de menor prioridad que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para superficies de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato de salida
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de los selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados aún aceptados por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal participe en el flujo estándar de quickstart `allowFrom`
- `forceAccountBinding`: requiere asociación explícita de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver objetivos de anuncio

OpenClaw también puede fusionar **catálogos externos de canales** (por ejemplo, una
exportación de registro MPM). Coloca un archivo JSON en una de estas rutas:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haz que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o más archivos JSON (delimitados por coma/punto y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como aliases heredados para la clave `"entries"`.

## Plugins del motor de contexto

Los plugins del motor de contexto son propietarios de la orquestación del contexto de sesión para ingesta, ensamblado
y compactación. Regístralos desde tu plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu plugin necesite reemplazar o extender la canalización de contexto predeterminada en lugar de solo agregar búsqueda en memory o hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si tu motor **no** es propietario del algoritmo de compactación, mantén `compact()`
implementado y delega explícitamente en él:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Agregar una nueva capacidad

Cuando un plugin necesite un comportamiento que no encaje en la API actual, no evites
el sistema de plugins con un acceso privado. Agrega la capacidad que falta.

Secuencia recomendada:

1. definir el contrato del core
   Decide qué comportamiento compartido debe ser propiedad del core: política, fallback, combinación de configuración,
   ciclo de vida, semántica orientada al canal y forma del asistente de tiempo de ejecución.
2. agregar superficies tipadas de registro/tiempo de ejecución para plugins
   Extiende `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada de capacidad más pequeña que sea útil.
3. conectar consumidores del core y de canal/función
   Los canales y plugins de función deben consumir la nueva capacidad a través del core,
   no importando directamente una implementación del proveedor.
4. registrar implementaciones del proveedor
   Los plugins de proveedor registran entonces sus backends en la capacidad.
5. agregar cobertura de contrato
   Agrega pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw mantiene una postura definida sin quedar codificado rígidamente a la
visión del mundo de un proveedor. Consulta el [Recetario de capacidades](/es/plugins/architecture)
para una lista concreta de archivos y un ejemplo trabajado.

### Lista de verificación de capacidades

Cuando agregues una nueva capacidad, la implementación normalmente debería tocar estas
superficies en conjunto:

- tipos de contrato del core en `src/<capability>/types.ts`
- runner/asistente de tiempo de ejecución del core en `src/<capability>/runtime.ts`
- superficie de registro de la API de plugins en `src/plugins/types.ts`
- conexión del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución del plugin en `src/plugins/runtime/*` cuando los plugins de función/canal
  necesiten consumirlo
- asistentes de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operadores/plugins en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
todavía no está completamente integrada.

### Plantilla de capacidad

Patrón mínimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Patrón de prueba de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Eso mantiene la regla simple:

- el core es propietario del contrato de capacidad y de la orquestación
- los plugins de proveedor son propietarios de las implementaciones del proveedor
- los plugins de función/canal consumen asistentes de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
