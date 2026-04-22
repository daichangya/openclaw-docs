---
read_when:
    - Crear o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de Plugin o los límites de propiedad
    - Trabajar en la canalización de carga o el registro de Plugin
    - Implementar hooks de tiempo de ejecución de proveedores o plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y ayudantes de tiempo de ejecución'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de Plugin

<Info>
  Esta es la **referencia profunda de arquitectura**. Para guías prácticas, consulta:
  - [Instalar y usar plugins](/es/tools/plugin) — guía de usuario
  - [Primeros pasos](/es/plugins/building-plugins) — primer tutorial de Plugin
  - [Plugins de canal](/es/plugins/sdk-channel-plugins) — crea un canal de mensajería
  - [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crea un proveedor de modelos
  - [Resumen del SDK](/es/plugins/sdk-overview) — mapa de importación y API de registro
</Info>

Esta página cubre la arquitectura interna del sistema de plugins de OpenClaw.

## Modelo público de capacidades

Las capacidades son el modelo público de **Plugin nativo** dentro de OpenClaw. Cada
Plugin nativo de OpenClaw se registra en uno o más tipos de capacidad:

| Capacidad              | Método de registro                               | Plugins de ejemplo                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| Inferencia de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| Backend de inferencia CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                 |
| Voz                    | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voz en tiempo real     | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| Comprensión de multimedia | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                    |
| Generación de imágenes | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| Generación de música   | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| Generación de video    | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| Recuperación web       | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| Búsqueda web           | `api.registerWebSearchProvider(...)`             | `google`                              |
| Canal / mensajería     | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |

Un Plugin que registra cero capacidades pero proporciona hooks, tools o
services es un Plugin **heredado solo con hooks**. Ese patrón sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya llegó al core y lo usan los plugins empaquetados/nativos
hoy, pero la compatibilidad de plugins externos todavía necesita un criterio más estricto que “está
exportado, por lo tanto está congelado”.

Orientación actual:

- **plugins externos existentes:** mantén funcionando las integraciones basadas en hooks; trata
  esto como la línea base de compatibilidad
- **nuevos plugins empaquetados/nativos:** prefiere el registro explícito de capacidades frente a
  accesos específicos de proveedor o nuevos diseños solo con hooks
- **plugins externos que adoptan el registro de capacidades:** permitido, pero trata las
  superficies auxiliares específicas de capacidad como evolutivas salvo que la documentación marque explícitamente un
  contrato como estable

Regla práctica:

- las API de registro de capacidades son la dirección prevista
- los hooks heredados siguen siendo la vía más segura sin rupturas para plugins externos durante
  la transición
- no todas las subrutas auxiliares exportadas son iguales; prefiere el contrato estrecho documentado,
  no las exportaciones auxiliares incidentales

### Formas de Plugin

OpenClaw clasifica cada Plugin cargado en una forma según su comportamiento real
de registro (no solo por metadatos estáticos):

- **plain-capability** -- registra exactamente un tipo de capacidad (por ejemplo, un
  Plugin solo de proveedor como `mistral`)
- **hybrid-capability** -- registra varios tipos de capacidad (por ejemplo,
  `openai` posee inferencia de texto, voz, comprensión de multimedia y generación de
  imágenes)
- **hook-only** -- registra solo hooks (tipados o personalizados), sin capacidades,
  tools, commands ni services
- **non-capability** -- registra tools, commands, services o routes pero no
  capacidades

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin y el desglose
de capacidades. Consulta [referencia de CLI](/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como vía de compatibilidad para
plugins solo con hooks. Plugins heredados del mundo real todavía dependen de él.

Dirección:

- mantenlo funcionando
- documéntalo como heredado
- prefiere `before_model_resolve` para trabajo de reemplazo de modelo/proveedor
- prefiere `before_prompt_build` para trabajo de mutación de prompts
- elimínalo solo cuando el uso real disminuya y la cobertura de fixtures demuestre seguridad de migración

### Señales de compatibilidad

Cuando ejecutas `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **config valid**          | La configuración se analiza bien y los plugins se resuelven |
| **compatibility advisory** | El Plugin usa un patrón compatible pero antiguo (p. ej. `hook-only`) |
| **legacy warning**        | El Plugin usa `before_agent_start`, que está obsoleto       |
| **hard error**            | La configuración no es válida o el Plugin no se pudo cargar |

Ni `hook-only` ni `before_agent_start` romperán tu Plugin hoy --
`hook-only` es informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces de espacio de trabajo,
   raíces globales de extensiones y extensiones empaquetadas. El descubrimiento lee primero los
   manifiestos nativos `openclaw.plugin.json` y los manifiestos de bundles compatibles.
2. **Habilitación + validación**
   El core decide si un Plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para un slot exclusivo como memory.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de superficie**
   El resto de OpenClaw lee el registro para exponer tools, canales, configuración de proveedor,
   hooks, rutas HTTP, comandos CLI y services.

Para la CLI de plugins específicamente, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos en tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del Plugin puede seguir siendo lazy y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del Plugin dentro del propio Plugin y al mismo tiempo permite a OpenClaw
reservar nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- el descubrimiento + la validación de configuración deben funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del Plugin
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del Plugin

Esa división permite a OpenClaw validar la configuración, explicar plugins faltantes/deshabilitados y
construir sugerencias de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Plugins de canal y la tool compartida de mensajes

Los plugins de canal no necesitan registrar una tool separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una tool `message` compartida en el core, y
los plugins de canal poseen el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el core posee el host compartido de la tool `message`, el cableado de prompts, la
  contabilidad de sesión/hilo y el despacho de ejecución
- los plugins de canal poseen el descubrimiento de acciones con alcance, el descubrimiento de capacidades y cualquier
  fragmento de esquema específico del canal
- los plugins de canal poseen la gramática de conversación de sesión específica del proveedor, como
  cómo los ID de conversación codifican ID de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un Plugin devuelva juntas sus acciones visibles, capacidades y
contribuciones al esquema para que esas piezas no diverjan.

Cuando un parámetro de tool de mensaje específico de canal transporta una fuente de multimedia como una
ruta local o URL remota de multimedia, el Plugin también debe devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El core usa esa lista explícita
para aplicar normalización de rutas de sandbox y sugerencias de acceso saliente a multimedia
sin codificar nombres de parámetros propiedad del Plugin.
Prefiere mapas con alcance por acción ahí, no una única lista plana de todo el canal, para que un
parámetro de multimedia solo de perfil no se normalice en acciones no relacionadas como
`send`.

El core pasa el alcance de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante confiable

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la
identidad confiable del solicitante sin codificar ramas específicas del canal en la tool
`message` del core.

Por eso los cambios de enrutamiento del runner incrustado siguen siendo trabajo del Plugin: el runner es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del Plugin
para que la tool compartida `message` exponga la superficie correcta propiedad del canal
para el turno actual.

Para ayudantes de ejecución propiedad del canal, los plugins empaquetados deben mantener el tiempo de ejecución
de la ejecución dentro de sus propios módulos de extensión. El core ya no posee los
tiempos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp bajo `src/agents/tools`.
No publicamos subrutas `plugin-sdk/*-action-runtime` separadas, y los plugins empaquetados
deben importar su propio código local de tiempo de ejecución directamente desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a los seams del SDK nombrados por proveedor en general: el core no
debe importar barrels de conveniencia específicos de canal para Slack, Discord, Signal,
WhatsApp o extensiones similares. Si el core necesita un comportamiento, debe consumir el
barrel `api.ts` / `runtime-api.ts` del propio Plugin empaquetado o promover la necesidad
a una capacidad genérica estrecha en el SDK compartido.

Para encuestas específicamente, hay dos rutas de ejecución:

- `outbound.sendPoll` es la línea base compartida para canales que encajan en el modelo
  común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semántica de encuestas específica del canal
  o parámetros adicionales de encuestas

El core ahora pospone el análisis compartido de encuestas hasta después de que el despacho de encuestas del Plugin rechace
la acción, para que los controladores de encuestas propiedad del Plugin puedan aceptar campos de encuesta
específicos del canal sin quedar bloqueados primero por el analizador genérico de encuestas.

Consulta [Canalización de carga](#load-pipeline) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad de una **empresa** o una
**función**, no como una bolsa de integraciones no relacionadas.

Eso significa:

- un Plugin de empresa normalmente debe poseer todas las superficies de OpenClaw de esa empresa
- un Plugin de función normalmente debe poseer toda la superficie de la función que introduce
- los canales deben consumir capacidades compartidas del core en lugar de reimplementar
  comportamiento del proveedor de manera ad hoc

Ejemplos:

- el Plugin empaquetado `openai` posee el comportamiento de proveedor de modelos de OpenAI y el comportamiento de OpenAI de
  voz + voz en tiempo real + comprensión de multimedia + generación de imágenes
- el Plugin empaquetado `elevenlabs` posee el comportamiento de voz de ElevenLabs
- el Plugin empaquetado `microsoft` posee el comportamiento de voz de Microsoft
- el Plugin empaquetado `google` posee el comportamiento de proveedor de modelos de Google más el comportamiento de Google de
  comprensión de multimedia + generación de imágenes + búsqueda web
- el Plugin empaquetado `firecrawl` posee el comportamiento de recuperación web de Firecrawl
- los plugins empaquetados `minimax`, `mistral`, `moonshot` y `zai` poseen sus
  backends de comprensión de multimedia
- el Plugin empaquetado `qwen` posee el comportamiento de proveedor de texto de Qwen más el
  comportamiento de comprensión de multimedia y generación de video
- el Plugin `voice-call` es un Plugin de función: posee transporte de llamadas, tools,
  CLI, routes y el puente de flujo de multimedia de Twilio, pero consume capacidades compartidas de voz
  más transcripción en tiempo real y voz en tiempo real en lugar de
  importar directamente plugins de proveedor

El estado final previsto es:

- OpenAI vive en un solo Plugin incluso si abarca modelos de texto, voz, imágenes y
  video futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué Plugin de proveedor posee el proveedor; consumen el
  contrato de capacidad compartido expuesto por el core

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capability** = contrato del core que varios plugins pueden implementar o consumir

Así que si OpenClaw agrega un nuevo dominio como video, la primera pregunta no es
“¿qué proveedor debe codificar el manejo de video?” La primera pregunta es “¿cuál es
el contrato de capacidad de video del core?” Una vez que existe ese contrato, los plugins de proveedor
pueden registrarse contra él y los plugins de canal/función pueden consumirlo.

Si la capacidad todavía no existe, normalmente el movimiento correcto es:

1. definir la capacidad faltante en el core
2. exponerla mediante la API/el tiempo de ejecución de Plugin de forma tipada
3. conectar canales/funciones contra esa capacidad
4. permitir que los plugins de proveedor registren implementaciones

Esto mantiene la propiedad explícita y evita comportamiento del core que dependa de un
solo proveedor o de una ruta de código específica de un Plugin puntual.

### Estratificación de capacidades

Usa este modelo mental al decidir dónde debe ir el código:

- **capa de capacidad del core**: orquestación compartida, política, fallback, reglas de
  fusión de configuración, semántica de entrega y contratos tipados
- **capa de Plugin de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis de voz,
  generación de imágenes, backends de video futuro, endpoints de uso
- **capa de Plugin de canal/función**: integración Slack/Discord/voice-call/etc.
  que consume capacidades del core y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el core posee la política de TTS en tiempo de respuesta, orden de fallback, preferencias y entrega por canal
- `openai`, `elevenlabs` y `microsoft` poseen las implementaciones de síntesis
- `voice-call` consume el helper de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debe preferirse para capacidades futuras.

### Ejemplo de Plugin de empresa con varias capacidades

Un Plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene
contratos compartidos para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de multimedia,
generación de imágenes, generación de video, recuperación web y búsqueda web,
un proveedor puede poseer todas sus superficies en un solo lugar:

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

Lo importante no son los nombres exactos de los helpers. Lo que importa es la forma:

- un Plugin posee la superficie del proveedor
- el core sigue poseyendo los contratos de capacidad
- los plugins de canal y de función consumen helpers `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el Plugin registró las capacidades que
  afirma poseer

### Ejemplo de capacidad: comprensión de video

OpenClaw ya trata la comprensión de imagen/audio/video como una sola
capacidad compartida. El mismo modelo de propiedad se aplica ahí:

1. el core define el contrato de comprensión de multimedia
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y de función consumen el comportamiento compartido del core en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el core las suposiciones de video de un proveedor. El Plugin posee
la superficie del proveedor; el core posee el contrato de capacidad y el comportamiento de fallback.

La generación de video ya usa esa misma secuencia: el core posee el contrato tipado
de capacidad y el helper de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista de verificación concreta de despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de Plugin está intencionadamente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro admitidos y
los helpers de tiempo de ejecución en los que un Plugin puede confiar.

Por qué importa:

- los autores de plugins obtienen un estándar interno estable
- el core puede rechazar propiedad duplicada, como dos plugins que registran el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos accionables para registros mal formados
- las pruebas de contrato pueden imponer la propiedad de plugins empaquetados y evitar desvíos silenciosos

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros mientras se cargan los plugins. Ejemplos:
   id de proveedores duplicados, id de proveedores de voz duplicados y registros
   mal formados producen diagnósticos de Plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins empaquetados se capturan en registros de contrato durante las ejecuciones de prueba para que
   OpenClaw pueda afirmar la propiedad explícitamente. Hoy esto se usa para proveedores de
   modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registros empaquetados.

El efecto práctico es que OpenClaw sabe, de antemano, qué Plugin posee qué
superficie. Eso permite que el core y los canales compongan sin fricciones porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de Plugin son:

- tipados
- pequeños
- específicos de capacidad
- propiedad del core
- reutilizables por varios plugins
- consumibles por canales/funciones sin conocimiento del proveedor

Los malos contratos de Plugin son:

- política específica del proveedor oculta en el core
- vías de escape puntuales de Plugin que eluden el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` ni de
  `api.runtime`

Cuando tengas dudas, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con Gateway. No están
aislados. Un Plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que
el código del core.

Implicaciones:

- un Plugin nativo puede registrar tools, controladores de red, hooks y services
- un error en un Plugin nativo puede bloquear o desestabilizar el gateway
- un Plugin nativo malicioso equivale a ejecución arbitraria de código dentro
  del proceso de OpenClaw

Los bundles compatibles son más seguros de forma predeterminada porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa principalmente
Skills empaquetadas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no empaquetados. Trata
los plugins de espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes empaquetados del espacio de trabajo, mantén el id del Plugin anclado en el nombre
de npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionadamente un rol de Plugin más estrecho.

Nota importante de confianza:

- `plugins.allow` confía en **id de Plugin**, no en la procedencia de la fuente.
- Un Plugin de espacio de trabajo con el mismo id que un Plugin empaquetado sombreará intencionadamente
  la copia empaquetada cuando ese Plugin de espacio de trabajo esté habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y hotfixes.

## Límite de exportación

OpenClaw exporta capacidades, no conveniencia de implementación.

Mantén público el registro de capacidades. Reduce exportaciones auxiliares que no son contrato:

- subrutas auxiliares específicas de plugins empaquetados
- subrutas de fontanería de tiempo de ejecución que no están pensadas como API pública
- helpers de conveniencia específicos de proveedor
- helpers de configuración/onboarding que son detalles de implementación

Algunas subrutas auxiliares de plugins empaquetados siguen presentes en el mapa de exportación generado del SDK
por compatibilidad y mantenimiento de plugins empaquetados. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varios seams `plugin-sdk/matrix*`. Trátalos como
exportaciones reservadas de detalle de implementación, no como el patrón recomendado del SDK para
nuevos plugins de terceros.

## Canalización de carga

En el inicio, OpenClaw hace aproximadamente esto:

1. descubre raíces candidatas de plugins
2. lee manifiestos nativos o de bundles compatibles y metadatos del paquete
3. rechaza candidatos inseguros
4. normaliza la configuración de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide la habilitación para cada candidato
6. carga módulos nativos habilitados mediante jiti
7. llama a los hooks nativos `register(api)` (o `activate(api)` — un alias heredado) y recopila registros en el registro de plugins
8. expone el registro a comandos/superficies de tiempo de ejecución

<Note>
`activate` es un alias heredado de `register` — el cargador resuelve el que esté presente (`def.register ?? def.activate`) y lo llama en el mismo punto. Todos los plugins empaquetados usan `register`; prefiere `register` para plugins nuevos.
</Note>

Las restricciones de seguridad ocurren **antes** de la ejecución en tiempo de ejecución. Los candidatos se bloquean
cuando la entrada escapa de la raíz del Plugin, la ruta es grabable por cualquiera o la
propiedad de la ruta parece sospechosa para plugins no empaquetados.

### Comportamiento primero del manifiesto

El manifiesto es la fuente de verdad del plano de control. OpenClaw lo usa para:

- identificar el Plugin
- descubrir canales/Skills/esquema de configuración declarados o capacidades de bundle
- validar `plugins.entries.<id>.config`
- ampliar etiquetas/placeholders de Control UI
- mostrar metadatos de instalación/catálogo
- conservar descriptores baratos de activación y configuración sin cargar el tiempo de ejecución del Plugin

Para plugins nativos, el módulo de tiempo de ejecución es la parte del plano de datos. Registra
comportamiento real como hooks, tools, commands o flujos de proveedor.

Los bloques opcionales del manifiesto `activation` y `setup` permanecen en el plano de control.
Son descriptores solo de metadatos para planificación de activación y descubrimiento de configuración;
no reemplazan el registro en tiempo de ejecución, `register(...)` ni `setupEntry`.
Los primeros consumidores de activación en vivo ahora usan sugerencias del manifiesto de comandos, canales y proveedores
para acotar la carga de plugins antes de una materialización más amplia del registro:

- la carga de CLI se acota a plugins que poseen el comando principal solicitado
- la resolución de configuración/Plugin de canal se acota a plugins que poseen el
  id de canal solicitado
- la resolución explícita de configuración/tiempo de ejecución de proveedor se acota a plugins que poseen el
  id de proveedor solicitado

El descubrimiento de configuración ahora prefiere id propiedad del descriptor como `setup.providers` y
`setup.cliBackends` para acotar los plugins candidatos antes de recurrir a
`setup-api` para plugins que todavía necesitan hooks de tiempo de ejecución en la configuración. Si más de
un Plugin descubierto reclama el mismo id normalizado de proveedor de configuración o backend CLI,
la búsqueda de configuración rechaza el propietario ambiguo en lugar de depender del orden de descubrimiento.

### Qué almacena en caché el cargador

OpenClaw mantiene cachés breves en proceso para:

- resultados de descubrimiento
- datos de registro de manifiestos
- registros de plugins cargados

Estas cachés reducen los picos de inicio y la sobrecarga de comandos repetidos. Se pueden
considerar como cachés de rendimiento de vida corta, no como persistencia.

Nota de rendimiento:

- Usa `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para deshabilitar estas cachés.
- Ajusta las ventanas de caché con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` y
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Los plugins cargados no modifican directamente globals aleatorios del core. Se registran en un
registro central de plugins.

El registro rastrea:

- registros de plugins (identidad, fuente, origen, estado, diagnósticos)
- tools
- hooks heredados y hooks tipados
- canales
- proveedores
- controladores RPC de gateway
- routes HTTP
- registradores de CLI
- services en segundo plano
- commands propiedad del Plugin

Las funciones del core luego leen de ese registro en lugar de hablar directamente con los módulos de Plugin.
Esto mantiene la carga en una sola dirección:

- módulo de Plugin -> registro en el registro
- tiempo de ejecución del core -> consumo del registro

Esa separación importa para la mantenibilidad. Significa que la mayoría de las superficies del core solo
necesitan un punto de integración: “leer el registro”, no “hacer casos especiales para cada módulo
de Plugin”.

## Callbacks de enlace de conversación

Los plugins que enlazan una conversación pueden reaccionar cuando se resuelve una aprobación.

Usa `api.onConversationBindingResolved(...)` para recibir un callback después de que una solicitud de enlace
sea aprobada o denegada:

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
- `binding`: el enlace resuelto para solicitudes aprobadas
- `request`: el resumen original de la solicitud, sugerencia de separación, id del remitente y
  metadatos de la conversación

Este callback es solo de notificación. No cambia quién puede enlazar una
conversación, y se ejecuta después de que termina el manejo de aprobación del core.

## Hooks de tiempo de ejecución del proveedor

Los plugins de proveedor ahora tienen dos capas:

- metadatos del manifiesto: `providerAuthEnvVars` para búsqueda barata de autenticación del proveedor por variable de entorno
  antes de la carga en tiempo de ejecución, `providerAuthAliases` para variantes de proveedor que comparten
  autenticación, `channelEnvVars` para búsqueda barata de configuración/variables de entorno de canal antes de la
  carga en tiempo de ejecución, además de `providerAuthChoices` para etiquetas baratas de onboarding/elección de autenticación y
  metadatos de flags de CLI antes de la carga en tiempo de ejecución
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw sigue poseyendo el bucle genérico de agente, el failover, el manejo de transcripciones y la
política de tools. Estos hooks son la superficie de extensión para comportamiento específico del proveedor sin
necesitar todo un transporte de inferencia personalizado.

Usa el manifiesto `providerAuthEnvVars` cuando el proveedor tenga credenciales basadas en variables de entorno
que las rutas genéricas de autenticación/estado/selector de modelo deban ver sin cargar el tiempo de ejecución del Plugin.
Usa el manifiesto `providerAuthAliases` cuando un id de proveedor deba reutilizar las variables de entorno,
perfiles de autenticación, autenticación respaldada por configuración y la elección de onboarding de clave API de otro id de proveedor. Usa el manifiesto `providerAuthChoices` cuando las
superficies CLI de onboarding/elección de autenticación deban conocer el id de elección del proveedor, etiquetas de grupo y
conexión simple de autenticación con un solo flag sin cargar el tiempo de ejecución del proveedor. Mantén `envVars`
del tiempo de ejecución del proveedor para sugerencias orientadas al operador como etiquetas de onboarding o variables de configuración
de client-id/client-secret de OAuth.

Usa el manifiesto `channelEnvVars` cuando un canal tenga autenticación o configuración basada en variables de entorno que
el fallback genérico de variables de shell, las comprobaciones de configuración/estado o los avisos de configuración deban ver
sin cargar el tiempo de ejecución del canal.

### Orden de hooks y uso

Para plugins de modelo/proveedor, OpenClaw llama a los hooks en este orden aproximado.
La columna “Cuándo usar” es la guía rápida de decisión.

| #   | Hook                              | Qué hace                                                                                                       | Cuándo usar                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica la configuración del proveedor en `models.providers` durante la generación de `models.json`          | El proveedor posee un catálogo o valores predeterminados de URL base                                                                        |
| 2   | `applyConfigDefaults`             | Aplica valores predeterminados globales de configuración propiedad del proveedor durante la materialización de configuración | Los valores predeterminados dependen del modo de autenticación, variables de entorno o semántica de familia de modelos del proveedor       |
| --  | _(búsqueda de modelos integrada)_ | OpenClaw prueba primero la ruta normal de registro/catálogo                                                   | _(no es un hook de Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza alias heredados o de vista previa de id de modelo antes de la búsqueda                              | El proveedor posee la limpieza de alias antes de la resolución canónica del modelo                                                          |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` de la familia del proveedor antes del ensamblaje genérico del modelo             | El proveedor posee la limpieza de transporte para id de proveedor personalizados en la misma familia de transporte                          |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes de la resolución de proveedor/tiempo de ejecución                     | El proveedor necesita limpieza de configuración que debe vivir con el Plugin; los helpers empaquetados de la familia Google también respaldan entradas compatibles de configuración de Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescrituras de compatibilidad de uso de transmisión nativa a proveedores de configuración             | El proveedor necesita correcciones de metadatos de uso de transmisión nativa impulsadas por endpoint                                       |
| 7   | `resolveConfigApiKey`             | Resuelve autenticación con marcador de variable de entorno para proveedores de configuración antes de cargar autenticación en tiempo de ejecución | El proveedor tiene resolución de clave API con marcador de variable de entorno propiedad del proveedor; `amazon-bedrock` también tiene aquí un resolvedor integrado de marcadores de entorno de AWS |
| 8   | `resolveSyntheticAuth`            | Expone autenticación local/alojada por uno mismo o respaldada por configuración sin persistir texto sin formato | El proveedor puede operar con un marcador sintético/local de credencial                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Superpone perfiles externos de autenticación propiedad del proveedor; `persistence` predeterminado es `runtime-only` para credenciales propiedad de CLI/app | El proveedor reutiliza credenciales externas de autenticación sin persistir tokens de actualización copiados                               |
| 10  | `shouldDeferSyntheticProfileAuth` | Baja la prioridad de marcadores sintéticos almacenados de perfil frente a autenticación respaldada por variables de entorno/configuración | El proveedor almacena perfiles sintéticos de marcador que no deben ganar precedencia                                                       |
| 11  | `resolveDynamicModel`             | Respaldo síncrono para id de modelo propiedad del proveedor que todavía no están en el registro local         | El proveedor acepta id de modelos arbitrarios del upstream                                                                                 |
| 12  | `prepareDynamicModel`             | Calentamiento asíncrono; luego `resolveDynamicModel` se ejecuta de nuevo                                      | El proveedor necesita metadatos de red antes de resolver id desconocidos                                                                    |
| 13  | `normalizeResolvedModel`          | Reescritura final antes de que el runner incrustado use el modelo resuelto                                    | El proveedor necesita reescrituras de transporte pero sigue usando un transporte del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Aporta flags de compatibilidad para modelos del proveedor detrás de otro transporte compatible                | El proveedor reconoce sus propios modelos en transportes proxy sin asumir el control del proveedor                                         |
| 15  | `capabilities`                    | Metadatos de transcripción/tools propiedad del proveedor usados por la lógica compartida del core             | El proveedor necesita particularidades de transcripción/familia de proveedor                                                                |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de tools antes de que el runner incrustado los vea                                         | El proveedor necesita limpieza de esquemas de la familia de transporte                                                                      |
| 17  | `inspectToolSchemas`              | Expone diagnósticos de esquema propiedad del proveedor tras la normalización                                   | El proveedor quiere advertencias de palabras clave sin enseñar al core reglas específicas del proveedor                                    |
| 18  | `resolveReasoningOutputMode`      | Selecciona contrato nativo o etiquetado de salida de razonamiento                                             | El proveedor necesita salida etiquetada de razonamiento/final en lugar de campos nativos                                                   |
| 19  | `prepareExtraParams`              | Normalización de parámetros de solicitud antes de los wrappers genéricos de opciones de flujo                 | El proveedor necesita parámetros de solicitud predeterminados o limpieza de parámetros por proveedor                                        |
| 20  | `createStreamFn`                  | Reemplaza por completo la ruta normal de flujo con un transporte personalizado                                | El proveedor necesita un protocolo de cable personalizado, no solo un wrapper                                                              |
| 21  | `wrapStreamFn`                    | Wrapper de flujo después de aplicar wrappers genéricos                                                        | El proveedor necesita wrappers de compatibilidad de encabezados/cuerpo/modelo de solicitud sin un transporte personalizado                 |
| 22  | `resolveTransportTurnState`       | Adjunta encabezados nativos por turno del transporte o metadatos                                              | El proveedor quiere que transportes genéricos envíen identidad nativa del proveedor por turno                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Adjunta encabezados nativos de WebSocket o política de enfriamiento de sesión                                 | El proveedor quiere que los transportes WS genéricos ajusten encabezados de sesión o política de fallback                                  |
| 24  | `formatApiKey`                    | Formateador de perfil de autenticación: el perfil almacenado pasa a ser la cadena `apiKey` de tiempo de ejecución | El proveedor almacena metadatos adicionales de autenticación y necesita una forma personalizada de token en tiempo de ejecución            |
| 25  | `refreshOAuth`                    | Reemplazo de actualización OAuth para endpoints personalizados de actualización o política de fallo de actualización | El proveedor no encaja en los actualizadores compartidos `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Sugerencia de reparación añadida cuando falla la actualización OAuth                                          | El proveedor necesita orientación de reparación de autenticación propiedad del proveedor tras un fallo de actualización                     |
| 27  | `matchesContextOverflowError`     | Comparador propiedad del proveedor para desbordamiento de ventana de contexto                                  | El proveedor tiene errores sin procesar de desbordamiento que la heurística genérica no detectaría                                         |
| 28  | `classifyFailoverReason`          | Clasificación propiedad del proveedor del motivo de failover                                                  | El proveedor puede asignar errores sin procesar de API/transporte a límite de velocidad/sobrecarga/etc.                                   |
| 29  | `isCacheTtlEligible`              | Política de caché de prompt para proveedores proxy/backhaul                                                   | El proveedor necesita restricción de TTL de caché específica para proxy                                                                     |
| 30  | `buildMissingAuthMessage`         | Sustitución del mensaje genérico de recuperación por autenticación faltante                                   | El proveedor necesita una sugerencia específica del proveedor para recuperar autenticación faltante                                         |
| 31  | `suppressBuiltInModel`            | Supresión de modelos obsoletos del upstream más sugerencia opcional de error orientada al usuario            | El proveedor necesita ocultar filas obsoletas del upstream o reemplazarlas por una sugerencia del proveedor                                |
| 32  | `augmentModelCatalog`             | Filas sintéticas/finales de catálogo agregadas después del descubrimiento                                     | El proveedor necesita filas sintéticas de compatibilidad futura en `models list` y selectores                                              |
| 33  | `resolveThinkingProfile`          | Conjunto de nivel `/think` específico del modelo, etiquetas de visualización y valor predeterminado          | El proveedor expone una escalera personalizada de thinking o una etiqueta binaria para modelos seleccionados                               |
| 34  | `isBinaryThinking`                | Hook de compatibilidad para alternancia on/off de razonamiento                                                | El proveedor expone solo thinking binario activado/desactivado                                                                              |
| 35  | `supportsXHighThinking`           | Hook de compatibilidad para soporte de razonamiento `xhigh`                                                   | El proveedor quiere `xhigh` solo en un subconjunto de modelos                                                                               |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidad para nivel predeterminado de `/think`                                                  | El proveedor posee la política predeterminada de `/think` para una familia de modelos                                                      |
| 37  | `isModernModelRef`                | Comparador de modelos modernos para filtros de perfil en vivo y selección de smoke                            | El proveedor posee la coincidencia de modelo preferido para en vivo/smoke                                                                   |
| 38  | `prepareRuntimeAuth`              | Intercambia una credencial configurada por el token/clave real de tiempo de ejecución justo antes de la inferencia | El proveedor necesita un intercambio de token o una credencial de solicitud de corta duración                                               |
| 39  | `resolveUsageAuth`                | Resuelve credenciales de uso/facturación para `/usage` y superficies relacionadas de estado                   | El proveedor necesita análisis personalizado de token de uso/cuota o una credencial distinta de uso                                        |
| 40  | `fetchUsageSnapshot`              | Recupera y normaliza instantáneas de uso/cuota específicas del proveedor después de resolver la autenticación | El proveedor necesita un endpoint de uso específico del proveedor o un analizador de carga útil                                             |
| 41  | `createEmbeddingProvider`         | Construye un adaptador de embeddings propiedad del proveedor para memory/search                                | El comportamiento de embeddings para memoria pertenece al Plugin del proveedor                                                              |
| 42  | `buildReplayPolicy`               | Devuelve una política de repetición que controla el manejo de transcripciones para el proveedor                | El proveedor necesita una política personalizada de transcripción (por ejemplo, eliminación de bloques de thinking)                        |
| 43  | `sanitizeReplayHistory`           | Reescribe el historial de repetición después de la limpieza genérica de transcripciones                        | El proveedor necesita reescrituras específicas del proveedor para repetición más allá de los helpers compartidos de Compaction             |
| 44  | `validateReplayTurns`             | Validación final o reestructuración de turnos de repetición antes del runner incrustado                       | El transporte del proveedor necesita una validación más estricta de turnos después del saneamiento genérico                                |
| 45  | `onModelSelected`                 | Ejecuta efectos secundarios propiedad del proveedor después de la selección                                    | El proveedor necesita telemetría o estado propiedad del proveedor cuando un modelo se activa                                                |

`normalizeModelId`, `normalizeTransport` y `normalizeConfig` primero comprueban el
Plugin de proveedor coincidente y luego pasan por otros plugins de proveedor con capacidad de hook
hasta que uno cambia realmente el id del modelo o el transporte/configuración. Eso mantiene funcionando
los shims de alias/proveedores compatibles sin exigir que el llamante sepa qué
Plugin empaquetado posee la reescritura. Si ningún hook de proveedor reescribe una entrada compatible
de configuración de la familia Google, el normalizador de configuración empaquetado de Google sigue aplicando
esa limpieza de compatibilidad.

Si el proveedor necesita un protocolo de cable completamente personalizado o un ejecutor de solicitudes personalizado,
esa es una clase diferente de extensión. Estos hooks son para comportamiento de proveedor
que todavía se ejecuta en el bucle normal de inferencia de OpenClaw.

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
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  y `wrapStreamFn` porque posee la compatibilidad futura de Claude 4.6,
  sugerencias de familia de proveedor, orientación para reparación de autenticación, integración con
  endpoint de uso, elegibilidad de caché de prompt, valores predeterminados de configuración con reconocimiento de autenticación, política predeterminada/adaptativa de thinking de Claude
  y conformación de flujo específica de Anthropic para
  encabezados beta, `/fast` / `serviceTier` y `context1m`.
- Los helpers de flujo específicos de Claude de Anthropic permanecen por ahora en el
  seam público `api.ts` / `contract-api.ts` del propio Plugin empaquetado. Esa superficie del paquete
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` y los builders de wrappers
  de Anthropic de nivel más bajo en lugar de ampliar el SDK genérico alrededor de las
  reglas de encabezados beta de un solo proveedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` y
  `capabilities`, además de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  porque posee la compatibilidad futura de GPT-5.4, la normalización directa de OpenAI
  `openai-completions` -> `openai-responses`, sugerencias de autenticación
  con reconocimiento de Codex, supresión de Spark, filas sintéticas de lista de OpenAI y la política
  de thinking / modelo en vivo de GPT-5; la familia de flujo `openai-responses-defaults` posee los
  wrappers nativos compartidos de OpenAI Responses para encabezados de atribución,
  `/fast`/`serviceTier`, verbosidad de texto, búsqueda web nativa de Codex,
  conformación de carga útil de compatibilidad de razonamiento y gestión de contexto de Responses.
- OpenRouter usa `catalog`, además de `resolveDynamicModel` y
  `prepareDynamicModel`, porque el proveedor es pass-through y puede exponer nuevos
  id de modelos antes de que se actualice el catálogo estático de OpenClaw; también usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para mantener
  fuera del core los encabezados de solicitud específicos del proveedor, los metadatos de enrutamiento, los parches de razonamiento y la
  política de caché de prompt. Su política de repetición proviene de la
  familia `passthrough-gemini`, mientras que la familia de flujo `openrouter-thinking`
  posee la inyección de razonamiento proxy y las omisiones de modelo no compatible / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` y
  `capabilities`, además de `prepareRuntimeAuth` y `fetchUsageSnapshot`, porque
  necesita inicio de sesión de dispositivo propiedad del proveedor, comportamiento de fallback de modelos, particularidades de transcripción
  de Claude, un intercambio de token de GitHub -> token de Copilot y un endpoint de uso propiedad del proveedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` y `augmentModelCatalog`, además de
  `prepareExtraParams`, `resolveUsageAuth` y `fetchUsageSnapshot`, porque
  todavía se ejecuta sobre los transportes core de OpenAI pero posee su
  normalización de transporte/URL base, política de fallback de actualización OAuth, elección predeterminada de transporte,
  filas sintéticas del catálogo de Codex e integración con el endpoint de uso de ChatGPT; comparte la misma familia de flujo `openai-responses-defaults` que OpenAI directo.
- Google AI Studio y Gemini CLI OAuth usan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque la
  familia de repetición `google-gemini` posee el fallback de compatibilidad futura de Gemini 3.1,
  la validación nativa de repetición de Gemini, el saneamiento de bootstrap de repetición, el modo etiquetado
  de salida de razonamiento y la coincidencia de modelos modernos, mientras que la
  familia de flujo `google-thinking` posee la normalización de carga útil de thinking de Gemini;
  Gemini CLI OAuth también usa `formatApiKey`, `resolveUsageAuth` y
  `fetchUsageSnapshot` para formato de token, análisis de token y conexión con endpoint
  de cuota.
- Anthropic Vertex usa `buildReplayPolicy` mediante la
  familia de repetición `anthropic-by-model` para que la limpieza de repetición específica de Claude quede
  limitada a id de Claude en lugar de a todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` y `resolveThinkingProfile` porque posee la
  clasificación específica de Bedrock de errores de limitación/no listo/desbordamiento de contexto
  para tráfico de Anthropic sobre Bedrock; su política de repetición sigue compartiendo la misma
  protección `anthropic-by-model` solo para Claude.
- OpenRouter, Kilocode, Opencode y Opencode Go usan `buildReplayPolicy`
  mediante la familia de repetición `passthrough-gemini` porque hacen proxy de modelos Gemini
  a través de transportes compatibles con OpenAI y necesitan
  saneamiento de firma de pensamiento de Gemini sin validación nativa de repetición de Gemini ni
  reescrituras de bootstrap.
- MiniMax usa `buildReplayPolicy` mediante la
  familia de repetición `hybrid-anthropic-openai` porque un proveedor posee tanto
  semántica de mensajes Anthropic como semántica compatible con OpenAI; mantiene la
  eliminación de bloques de thinking solo de Claude en el lado de Anthropic mientras reemplaza
  el modo de salida de razonamiento de vuelta a nativo, y la familia de flujo `minimax-fast-mode` posee
  reescrituras de modelos de modo rápido en la ruta de flujo compartida.
- Moonshot usa `catalog`, `resolveThinkingProfile` y `wrapStreamFn` porque todavía usa el
  transporte compartido de OpenAI pero necesita normalización de carga útil de thinking propiedad del proveedor; la
  familia de flujo `moonshot-thinking` asigna configuración más estado `/think` a su
  carga útil nativa binaria de thinking.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque necesita encabezados de solicitud propiedad del proveedor,
  normalización de carga útil de razonamiento, sugerencias de transcripción de Gemini y
  restricción Anthropic de TTL de caché; la familia de flujo `kilocode-thinking` mantiene la inyección de thinking de Kilo
  en la ruta compartida de flujo proxy mientras omite `kilo/auto` y
  otros id de modelos proxy que no admiten cargas útiles explícitas de razonamiento.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` y `fetchUsageSnapshot` porque posee el fallback de GLM-5,
  valores predeterminados de `tool_stream`, UX binaria de thinking, coincidencia de modelos modernos y tanto
  autenticación de uso como recuperación de cuota; la familia de flujo `tool-stream-default-on` mantiene
  el wrapper `tool_stream` activado por defecto fuera del código pegamento manuscrito por proveedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque posee la normalización de transporte nativo de xAI Responses, reescrituras de alias
  de modo rápido de Grok, `tool_stream` predeterminado, limpieza estricta de tools / carga útil de razonamiento,
  reutilización de autenticación de fallback para tools propiedad del Plugin, resolución de modelos Grok
  con compatibilidad futura y parches de compatibilidad propiedad del proveedor como perfil de
  esquema de tools de xAI, palabras clave de esquema no compatibles, `web_search` nativo y decodificación
  de argumentos de llamadas de tools con entidades HTML.
- Mistral, OpenCode Zen y OpenCode Go usan solo `capabilities` para mantener
  fuera del core las particularidades de transcripción/tools.
- Los proveedores empaquetados solo de catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` y `volcengine` usan
  solo `catalog`.
- Qwen usa `catalog` para su proveedor de texto, además de registros compartidos de comprensión de multimedia y
  generación de video para sus superficies multimodales.
- MiniMax y Xiaomi usan `catalog` más hooks de uso porque su comportamiento de `/usage`
  es propiedad del Plugin aunque la inferencia siga ejecutándose mediante los transportes compartidos.

## Helpers de tiempo de ejecución

Los plugins pueden acceder a helpers seleccionados del core mediante `api.runtime`. Para TTS:

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

- `textToSpeech` devuelve la carga útil normal de salida TTS del core para superficies de archivo/nota de voz.
- Usa la configuración `messages.tts` del core y la selección de proveedor.
- Devuelve buffer de audio PCM + frecuencia de muestreo. Los plugins deben remuestrear/codificar para los proveedores.
- `listVoices` es opcional por proveedor. Úsalo para selectores de voz o flujos de configuración propiedad del proveedor.
- Las listas de voces pueden incluir metadatos más ricos como locale, gender y etiquetas de personalidad para selectores adaptados al proveedor.
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

- Mantén en el core la política de TTS, el fallback y la entrega de respuestas.
- Usa proveedores de voz para comportamiento de síntesis propiedad del proveedor.
- La entrada heredada `edge` de Microsoft se normaliza al id de proveedor `microsoft`.
- El modelo de propiedad preferido está orientado a la empresa: un Plugin de proveedor puede poseer
  proveedores de texto, voz, imagen y de multimedia futuros a medida que OpenClaw agregue esos
  contratos de capacidad.

Para comprensión de imagen/audio/video, los plugins registran un proveedor tipado
de comprensión de multimedia en lugar de una bolsa genérica de clave/valor:

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

- Mantén la orquestación, el fallback, la configuración y el cableado de canal en el core.
- Mantén el comportamiento del proveedor en el Plugin del proveedor.
- La expansión aditiva debe seguir siendo tipada: nuevos métodos opcionales, nuevos campos opcionales
  de resultado, nuevas capacidades opcionales.
- La generación de video ya sigue el mismo patrón:
  - el core posee el contrato de capacidad y el helper de tiempo de ejecución
  - los plugins de proveedor registran `api.registerVideoGenerationProvider(...)`
  - los plugins de función/canal consumen `api.runtime.videoGeneration.*`

Para helpers de tiempo de ejecución de comprensión de multimedia, los plugins pueden llamar a:

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

Para transcripción de audio, los plugins pueden usar el tiempo de ejecución de comprensión de multimedia
o el alias STT más antiguo:

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
- Usa la configuración de audio de comprensión de multimedia del core (`tools.media.audio`) y el orden de fallback del proveedor.
- Devuelve `{ text: undefined }` cuando no se produce salida de transcripción (por ejemplo, entrada omitida/no compatible).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidad.

Los plugins también pueden iniciar ejecuciones de subagentes en segundo plano mediante `api.runtime.subagent`:

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
- OpenClaw solo respeta esos campos de reemplazo para llamantes confiables.
- Para ejecuciones de fallback propiedad del Plugin, los operadores deben activarlo con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` para restringir los plugins confiables a destinos canónicos específicos `provider/model`, o `"*"` para permitir explícitamente cualquier destino.
- Las ejecuciones de subagente de plugins no confiables siguen funcionando, pero las solicitudes de reemplazo se rechazan en lugar de recurrir silenciosamente a un fallback.

Para búsqueda web, los plugins pueden consumir el helper compartido de tiempo de ejecución en lugar de
acceder al cableado de tools del agente:

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
- `api.runtime.webSearch.*` es la superficie compartida preferida para plugins de función/canal que necesiten comportamiento de búsqueda sin depender del wrapper de tools del agente.

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

## Rutas HTTP de Gateway

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
- `auth`: obligatorio. Usa `"gateway"` para requerir la autenticación normal del gateway, o `"plugin"` para autenticación/verificación de Webhook gestionada por Plugin.
- `match`: opcional. `"exact"` (predeterminado) o `"prefix"`.
- `replaceExisting`: opcional. Permite que el mismo Plugin reemplace su propio registro de ruta existente.
- `handler`: devuelve `true` cuando la ruta haya gestionado la solicitud.

Notas:

- `api.registerHttpHandler(...)` se eliminó y provocará un error de carga de Plugin. Usa `api.registerHttpRoute(...)` en su lugar.
- Las rutas de Plugin deben declarar `auth` explícitamente.
- Los conflictos exactos de `path + match` se rechazan salvo que `replaceExisting: true`, y un Plugin no puede reemplazar la ruta de otro Plugin.
- Las rutas superpuestas con distintos niveles de `auth` se rechazan. Mantén las cadenas de caída `exact`/`prefix` solo en el mismo nivel de autenticación.
- Las rutas `auth: "plugin"` **no** reciben automáticamente alcances de tiempo de ejecución del operador. Son para webhooks/verificación de firmas gestionadas por Plugin, no para llamadas privilegiadas a helpers de Gateway.
- Las rutas `auth: "gateway"` se ejecutan dentro de un alcance de tiempo de ejecución de solicitud de Gateway, pero ese alcance es intencionadamente conservador:
  - la autenticación bearer con secreto compartido (`gateway.auth.mode = "token"` / `"password"`) mantiene los alcances de tiempo de ejecución de la ruta de Plugin fijados en `operator.write`, incluso si el llamante envía `x-openclaw-scopes`
  - los modos HTTP confiables con identidad (por ejemplo `trusted-proxy` o `gateway.auth.mode = "none"` en un ingreso privado) respetan `x-openclaw-scopes` solo cuando el encabezado está presente de forma explícita
  - si `x-openclaw-scopes` no está presente en esas solicitudes de ruta de Plugin con identidad, el alcance de tiempo de ejecución recurre a `operator.write`
- Regla práctica: no asumas que una ruta de Plugin con autenticación de gateway es una superficie implícita de administración. Si tu ruta necesita comportamiento exclusivo de administrador, exige un modo de autenticación con identidad y documenta el contrato explícito del encabezado `x-openclaw-scopes`.

## Rutas de importación del SDK de Plugin

Usa subrutas del SDK en lugar de la importación monolítica `openclaw/plugin-sdk` al
crear plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de Plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` para el cableado compartido de
  configuración/autenticación/respuesta/webhook. `channel-inbound` es el hogar compartido para debounce, coincidencia de menciones,
  helpers de política de mención entrante, formato de sobres y helpers de contexto de
  sobres entrantes.
  `channel-setup` es el seam estrecho de configuración para instalación opcional.
  `setup-runtime` es la superficie de configuración segura en tiempo de ejecución usada por `setupEntry` /
  inicio diferido, incluidos los adaptadores de parche de configuración seguros para importación.
  `setup-adapter-runtime` es el seam de adaptador de configuración de cuenta con reconocimiento de entorno.
  `setup-tools` es el seam pequeño de helpers de CLI/archivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subrutas de dominio como `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` para helpers compartidos de tiempo de ejecución/configuración.
  `telegram-command-config` es el seam público estrecho para normalización/validación de comandos personalizados de Telegram y sigue disponible incluso si la
  superficie de contrato empaquetada de Telegram no está disponible temporalmente.
  `text-runtime` es el seam compartido de texto/markdown/logging, que incluye
  eliminación de texto visible para el asistente, helpers de renderizado/fragmentación de markdown, helpers de redacción,
  helpers de etiquetas de directivas y utilidades de texto seguro.
- Los seams específicos de aprobación de canal deben preferir un contrato `approvalCapability`
  en el Plugin. El core luego lee autenticación, entrega, renderizado,
  enrutamiento nativo y comportamiento lazy del controlador nativo de aprobación mediante esa única capacidad
  en lugar de mezclar comportamiento de aprobación en campos no relacionados del Plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto y permanece solo como
  shim de compatibilidad para plugins antiguos. El código nuevo debe importar las primitivas genéricas más estrechas, y el código del repositorio no debe agregar nuevas importaciones del
  shim.
- Los internos de extensiones empaquetadas siguen siendo privados. Los plugins externos deben usar solo
  subrutas `openclaw/plugin-sdk/*`. El código core/test de OpenClaw puede usar los
  puntos de entrada públicos del repositorio bajo la raíz de un paquete de Plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` y archivos de alcance estrecho como
  `login-qr-api.js`. Nunca importes `src/*` de un paquete de Plugin desde el core ni desde
  otra extensión.
- División del punto de entrada del repositorio:
  `<plugin-package-root>/api.js` es el barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` es el barrel solo de tiempo de ejecución,
  `<plugin-package-root>/index.js` es la entrada del Plugin empaquetado
  y `<plugin-package-root>/setup-entry.js` es la entrada del Plugin de configuración.
- Ejemplos actuales de proveedores empaquetados:
  - Anthropic usa `api.js` / `contract-api.js` para helpers de flujo de Claude como
    `wrapAnthropicProviderStream`, helpers de encabezados beta y análisis de `service_tier`.
  - OpenAI usa `api.js` para builders de proveedor, helpers de modelo predeterminado y
    builders de proveedores en tiempo real.
  - OpenRouter usa `api.js` para su builder de proveedor, además de helpers de onboarding/configuración,
    mientras que `register.runtime.js` aún puede reexportar helpers genéricos
    `plugin-sdk/provider-stream` para uso local del repositorio.
- Los puntos de entrada públicos cargados por fachada prefieren la instantánea activa de configuración de tiempo de ejecución
  cuando existe una, y luego recurren a la configuración resuelta en disco cuando
  OpenClaw todavía no está sirviendo una instantánea de tiempo de ejecución.
- Las primitivas genéricas compartidas siguen siendo el contrato público preferido del SDK. Aún existe un pequeño
  conjunto reservado de compatibilidad de seams auxiliares marcados por canal empaquetado. Trátalos como
  seams de mantenimiento/compatibilidad empaquetados, no como nuevos destinos de importación para terceros; los nuevos contratos entre canales deben seguir llegando a subrutas genéricas `plugin-sdk/*` o a los barrels locales del Plugin `api.js` /
  `runtime-api.js`.

Nota de compatibilidad:

- Evita el barrel raíz `openclaw/plugin-sdk` en código nuevo.
- Prefiere primero las primitivas estables y estrechas. Las subrutas más nuevas de configuración/emparejamiento/respuesta/
  feedback/contrato/entrada/hilos/comando/secret-input/webhook/infra/
  allowlist/status/message-tool son el contrato previsto para trabajo nuevo de
  plugins empaquetados y externos.
  El análisis/coincidencia de destinos pertenece a `openclaw/plugin-sdk/channel-targets`.
  Las restricciones de acciones de mensajes y los helpers de id de mensaje de reacción pertenecen a
  `openclaw/plugin-sdk/channel-actions`.
- Los barrels auxiliares específicos de extensiones empaquetadas no son estables de forma predeterminada. Si un
  helper solo lo necesita una extensión empaquetada, mantenlo detrás del
  seam local `api.js` o `runtime-api.js` de la extensión en lugar de promocionarlo a
  `openclaw/plugin-sdk/<extension>`.
- Los nuevos seams auxiliares compartidos deben ser genéricos, no marcados por canal. El análisis compartido
  de destinos pertenece a `openclaw/plugin-sdk/channel-targets`; los internos específicos del canal
  permanecen detrás del seam local `api.js` o `runtime-api.js` del Plugin propietario.
- Existen subrutas específicas de capacidad como `image-generation`,
  `media-understanding` y `speech` porque los plugins empaquetados/nativos las usan
  hoy. Su presencia no significa por sí sola que cada helper exportado sea un
  contrato externo congelado a largo plazo.

## Esquemas de message tool

Los plugins deben poseer las contribuciones de esquema específicas del canal de `describeMessageTool(...)`
para primitivas que no sean mensajes, como reacciones, lecturas y encuestas.
La presentación compartida de envío debe usar el contrato genérico `MessagePresentation`
en lugar de campos nativos del proveedor para botones, componentes, bloques o tarjetas.
Consulta [Presentación de mensajes](/es/plugins/message-presentation) para el contrato,
reglas de fallback, mapeo por proveedor y lista de verificación para autores de plugins.

Los plugins con capacidad de envío declaran lo que pueden renderizar mediante capacidades de mensaje:

- `presentation` para bloques de presentación semántica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitudes de entrega fijada

El core decide si renderizar la presentación de forma nativa o degradarla a texto.
No expongas vías de escape de UI nativa del proveedor desde la message tool genérica.
Los helpers obsoletos del SDK para esquemas nativos heredados siguen exportados para plugins
de terceros existentes, pero los plugins nuevos no deben usarlos.

## Resolución de destinos de canal

Los plugins de canal deben poseer la semántica específica del canal de los destinos. Mantén genérico el
host compartido de salida y usa la superficie del adaptador de mensajería para reglas del proveedor:

- `messaging.inferTargetChatType({ to })` decide si un destino normalizado
  debe tratarse como `direct`, `group` o `channel` antes de la búsqueda en directorio.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indica al core si una
  entrada debe pasar directamente a resolución similar a id en lugar de búsqueda en directorio.
- `messaging.targetResolver.resolveTarget(...)` es el fallback del Plugin cuando
  el core necesita una resolución final propiedad del proveedor después de la normalización o tras un
  fallo de directorio.
- `messaging.resolveOutboundSessionRoute(...)` posee la construcción específica del proveedor
  de la ruta de sesión una vez resuelto el destino.

División recomendada:

- Usa `inferTargetChatType` para decisiones de categoría que deban ocurrir antes
  de buscar peers/groups.
- Usa `looksLikeId` para comprobaciones de “trata esto como un id de destino explícito/nativo”.
- Usa `resolveTarget` para fallback de normalización específico del proveedor, no para
  búsqueda amplia en directorio.
- Mantén id nativos del proveedor como id de chat, id de hilo, JID, identificadores y room
  id dentro de valores `target` o parámetros específicos del proveedor, no en campos genéricos del SDK.

## Directorios respaldados por configuración

Los plugins que derivan entradas de directorio a partir de la configuración deben mantener esa lógica en el
Plugin y reutilizar los helpers compartidos de
`openclaw/plugin-sdk/directory-runtime`.

Úsalo cuando un canal necesite peers/groups respaldados por configuración como:

- peers de mensajes directos controlados por allowlist
- mapas configurados de canales/grupos
- fallback de directorio estático con alcance por cuenta

Los helpers compartidos en `directory-runtime` solo manejan operaciones genéricas:

- filtrado de consultas
- aplicación de límites
- helpers de desduplicación/normalización
- construcción de `ChannelDirectoryEntry[]`

La inspección específica del canal de cuentas y la normalización de id deben permanecer en la
implementación del Plugin.

## Catálogos de proveedores

Los plugins de proveedor pueden definir catálogos de modelos para inferencia con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` devuelve la misma forma que OpenClaw escribe en
`models.providers`:

- `{ provider }` para una entrada de proveedor
- `{ providers }` para varias entradas de proveedor

Usa `catalog` cuando el Plugin posee id de modelos específicos del proveedor, valores predeterminados de URL base
o metadatos de modelos restringidos por autenticación.

`catalog.order` controla cuándo se fusiona el catálogo de un Plugin respecto a los
proveedores implícitos integrados de OpenClaw:

- `simple`: proveedores sencillos controlados por clave API o variable de entorno
- `profile`: proveedores que aparecen cuando existen perfiles de autenticación
- `paired`: proveedores que sintetizan varias entradas de proveedor relacionadas
- `late`: última pasada, después de otros proveedores implícitos

Los proveedores posteriores ganan en colisión de claves, así que los plugins pueden sobrescribir
intencionadamente una entrada integrada de proveedor con el mismo id de proveedor.

Compatibilidad:

- `discovery` sigue funcionando como alias heredado
- si se registran ambos `catalog` y `discovery`, OpenClaw usa `catalog`

## Inspección de canal de solo lectura

Si tu Plugin registra un canal, prefiere implementar
`plugin.config.inspectAccount(cfg, accountId)` junto con `resolveAccount(...)`.

Por qué:

- `resolveAccount(...)` es la ruta de tiempo de ejecución. Se le permite asumir que las credenciales
  están completamente materializadas y puede fallar rápidamente cuando faltan secretos requeridos.
- Las rutas de comandos de solo lectura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` y los flujos de reparación de doctor/config
  no deberían necesitar materializar credenciales de tiempo de ejecución solo para
  describir la configuración.

Comportamiento recomendado de `inspectAccount(...)`:

- Devuelve solo el estado descriptivo de la cuenta.
- Conserva `enabled` y `configured`.
- Incluye campos de origen/estado de credenciales cuando corresponda, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- No necesitas devolver valores sin procesar de tokens solo para informar
  disponibilidad de solo lectura. Devolver `tokenStatus: "available"` (y el campo
  de origen correspondiente) basta para comandos tipo estado.
- Usa `configured_unavailable` cuando una credencial esté configurada mediante SecretRef pero
  no esté disponible en la ruta de comando actual.

Esto permite que los comandos de solo lectura informen “configurado pero no disponible en esta ruta de comando”
en lugar de fallar o informar incorrectamente que la cuenta no está configurada.

## Paquetes pack

Un directorio de Plugin puede incluir un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se convierte en un Plugin. Si el pack enumera varias extensiones, el id del Plugin
pasa a ser `name/<fileBase>`.

Si tu Plugin importa dependencias npm, instálalas en ese directorio para que
`node_modules` esté disponible (`npm install` / `pnpm install`).

Barandilla de seguridad: cada entrada de `openclaw.extensions` debe permanecer dentro del directorio del Plugin
después de resolver symlinks. Las entradas que escapan del directorio del paquete se
rechazan.

Nota de seguridad: `openclaw plugins install` instala dependencias del Plugin con
`npm install --omit=dev --ignore-scripts` (sin scripts de ciclo de vida, sin dependencias de desarrollo en tiempo de ejecución). Mantén los árboles de dependencias del Plugin como
“JS/TS puro” y evita paquetes que requieran compilaciones en `postinstall`.

Opcional: `openclaw.setupEntry` puede apuntar a un módulo ligero solo de configuración.
Cuando OpenClaw necesita superficies de configuración para un Plugin de canal deshabilitado, o
cuando un Plugin de canal está habilitado pero todavía no está configurado, carga `setupEntry`
en lugar de la entrada completa del Plugin. Esto hace que el inicio y la configuración sean más ligeros
cuando la entrada principal del Plugin también conecta tools, hooks u otro código
solo de tiempo de ejecución.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
puede hacer que un Plugin de canal use la misma ruta `setupEntry` durante la fase
de inicio previa a la escucha del gateway, incluso cuando el canal ya está configurado.

Usa esto solo cuando `setupEntry` cubra completamente la superficie de inicio que debe existir
antes de que el gateway empiece a escuchar. En la práctica, eso significa que la entrada de configuración
debe registrar toda capacidad propiedad del canal de la que dependa el inicio, como:

- el propio registro del canal
- cualquier ruta HTTP que deba estar disponible antes de que el gateway empiece a escuchar
- cualquier método de gateway, tool o service que deba existir durante esa misma ventana

Si tu entrada completa sigue poseyendo alguna capacidad requerida de inicio, no actives
esta bandera. Mantén el comportamiento predeterminado del Plugin y deja que OpenClaw cargue la
entrada completa durante el inicio.

Los canales empaquetados también pueden publicar helpers de superficie de contrato solo de configuración que el core
puede consultar antes de que se cargue el tiempo de ejecución completo del canal. La superficie actual
de promoción de configuración es:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

El core usa esa superficie cuando necesita promover una configuración heredada de canal de cuenta única
a `channels.<id>.accounts.*` sin cargar la entrada completa del Plugin.
Matrix es el ejemplo empaquetado actual: mueve solo claves de autenticación/bootstrap a una
cuenta promovida con nombre cuando ya existen cuentas con nombre, y puede conservar una
clave configurada no canónica de cuenta predeterminada en lugar de crear siempre
`accounts.default`.

Esos adaptadores de parche de configuración mantienen lazy el descubrimiento de la superficie de contrato empaquetada. El
tiempo de importación sigue siendo ligero; la superficie de promoción se carga solo en el primer uso en lugar de
volver a entrar en el inicio del canal empaquetado al importar el módulo.

Cuando esas superficies de inicio incluyan métodos RPC de gateway, mantenlas en un
prefijo específico del Plugin. Los espacios de nombres reservados de administración del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen reservados y siempre se resuelven
a `operator.admin`, incluso si un Plugin solicita un alcance más estrecho.

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
sugerencias de instalación mediante `openclaw.install`. Esto mantiene el catálogo del core sin datos.

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
- `docsLabel`: reemplaza el texto del enlace para el enlace a la documentación
- `preferOver`: id de Plugin/canal de menor prioridad a los que esta entrada de catálogo debe superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto para superficies de selección
- `markdownCapable`: marca el canal como compatible con markdown para decisiones de formato saliente
- `exposure.configured`: oculta el canal de las superficies de listado de canales configurados cuando se establece en `false`
- `exposure.setup`: oculta el canal de selectores interactivos de configuración cuando se establece en `false`
- `exposure.docs`: marca el canal como interno/privado para superficies de navegación de documentación
- `showConfigured` / `showInSetup`: alias heredados que todavía se aceptan por compatibilidad; prefiere `exposure`
- `quickstartAllowFrom`: hace que el canal use el flujo estándar de quickstart `allowFrom`
- `forceAccountBinding`: requiere enlace explícito de cuenta incluso cuando solo existe una cuenta
- `preferSessionLookupForAnnounceTarget`: prefiere la búsqueda de sesión al resolver destinos de anuncio

OpenClaw también puede fusionar **catálogos externos de canales** (por ejemplo, una exportación de registro
de MPM). Coloca un archivo JSON en una de estas ubicaciones:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

O haz que `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) apunte a
uno o más archivos JSON (delimitados por comas/puntos y coma/`PATH`). Cada archivo debe
contener `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. El analizador también acepta `"packages"` o `"plugins"` como alias heredados de la clave `"entries"`.

## Plugins de motor de contexto

Los plugins de motor de contexto poseen la orquestación del contexto de sesión para ingestión, ensamblaje
y Compaction. Regístralos desde tu Plugin con
`api.registerContextEngine(id, factory)` y luego selecciona el motor activo con
`plugins.slots.contextEngine`.

Usa esto cuando tu Plugin necesite reemplazar o ampliar la canalización predeterminada de contexto
en lugar de solo agregar búsqueda en memory o hooks.

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

Si tu motor **no** posee el algoritmo de Compaction, mantén `compact()`
implementado y delega de forma explícita:

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

Cuando un Plugin necesita un comportamiento que no encaja en la API actual, no eludas
el sistema de plugins con un acceso privado. Agrega la capacidad faltante.

Secuencia recomendada:

1. define el contrato del core
   Decide qué comportamiento compartido debe poseer el core: política, fallback, fusión de configuración,
   ciclo de vida, semántica orientada a canales y forma del helper de tiempo de ejecución.
2. agrega superficies tipadas de registro/tiempo de ejecución de Plugin
   Amplía `OpenClawPluginApi` y/o `api.runtime` con la superficie tipada más pequeña y útil
   de capacidad.
3. conecta el core + consumidores de canal/función
   Los canales y plugins de función deben consumir la nueva capacidad mediante el core,
   no importando directamente una implementación de proveedor.
4. registra implementaciones de proveedor
   Los plugins de proveedor luego registran sus backends contra la capacidad.
5. agrega cobertura de contrato
   Agrega pruebas para que la propiedad y la forma del registro sigan siendo explícitas con el tiempo.

Así es como OpenClaw mantiene una opinión clara sin quedar codificado a la visión del mundo de un solo
proveedor. Consulta [Capability Cookbook](/es/plugins/architecture)
para ver una lista concreta de archivos y un ejemplo trabajado.

### Lista de verificación de capacidad

Cuando agregues una nueva capacidad, la implementación normalmente debe tocar estas
superficies juntas:

- tipos de contrato del core en `src/<capability>/types.ts`
- helper del core de runner/tiempo de ejecución en `src/<capability>/runtime.ts`
- superficie de registro de API de Plugin en `src/plugins/types.ts`
- cableado del registro de plugins en `src/plugins/registry.ts`
- exposición del tiempo de ejecución de Plugin en `src/plugins/runtime/*` cuando los plugins de función/canal
  necesitan consumirla
- helpers de captura/prueba en `src/test-utils/plugin-registration.ts`
- aserciones de propiedad/contrato en `src/plugins/contracts/registry.ts`
- documentación para operador/Plugin en `docs/`

Si falta una de esas superficies, normalmente es una señal de que la capacidad
todavía no está totalmente integrada.

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

Eso mantiene simple la regla:

- el core posee el contrato de capacidad + la orquestación
- los plugins de proveedor poseen las implementaciones del proveedor
- los plugins de función/canal consumen helpers de tiempo de ejecución
- las pruebas de contrato mantienen explícita la propiedad
