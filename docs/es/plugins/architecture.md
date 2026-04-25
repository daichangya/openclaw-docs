---
read_when:
    - Crear o depurar plugins nativos de OpenClaw
    - Comprender el modelo de capacidades de plugins o los límites de propiedad
    - Trabajar en la canalización de carga o el registro de plugins
    - Implementar hooks de tiempo de ejecución de proveedor o plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propiedad, contratos, canalización de carga y asistentes de tiempo de ejecución'
title: internos de Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Esta es la **referencia profunda de arquitectura** del sistema de plugins de OpenClaw. Para
guías prácticas, empieza con una de las páginas especializadas que aparecen abajo.

<CardGroup cols={2}>
  <Card title="Instalar y usar plugins" icon="plug" href="/es/tools/plugin">
    Guía para usuarios finales sobre cómo añadir, habilitar y solucionar problemas de plugins.
  </Card>
  <Card title="Crear plugins" icon="rocket" href="/es/plugins/building-plugins">
    Tutorial del primer plugin con el manifiesto funcional más pequeño.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/es/plugins/sdk-channel-plugins">
    Crea un plugin de canal de mensajería.
  </Card>
  <Card title="Plugins de proveedor" icon="microchip" href="/es/plugins/sdk-provider-plugins">
    Crea un plugin de proveedor de modelos.
  </Card>
  <Card title="Resumen del SDK" icon="book" href="/es/plugins/sdk-overview">
    Mapa de importación y referencia de la API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Las capacidades son el modelo público de **Plugin nativo** dentro de OpenClaw. Cada
Plugin nativo de OpenClaw se registra frente a uno o más tipos de capacidad:

| Capacidad             | Método de registro                              | Plugins de ejemplo                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencia de texto         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferencia CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Voz                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz en tiempo real         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Comprensión de contenido multimedia    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generación de imágenes       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generación de música       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generación de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Obtención web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Búsqueda web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensajería    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descubrimiento de Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

Un plugin que registra cero capacidades pero proporciona hooks, herramientas, servicios de descubrimiento
o servicios en segundo plano es un plugin **heredado solo de hooks**. Ese patrón
sigue siendo totalmente compatible.

### Postura de compatibilidad externa

El modelo de capacidades ya está integrado en el núcleo y lo usan los plugins
integrados/nativos hoy, pero la compatibilidad de plugins externos sigue necesitando un criterio
más estricto que “está exportado, por tanto está congelado”.

| Situación del plugin                                  | Guía                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                         | Mantén funcionando las integraciones basadas en hooks; esta es la base de compatibilidad.                        |
| Plugins nuevos integrados/nativos                        | Prefiere el registro explícito de capacidades en lugar de accesos específicos de proveedor o nuevos diseños solo con hooks. |
| Plugins externos que adoptan registro de capacidades | Está permitido, pero considera las superficies auxiliares específicas de capacidad como cambiantes salvo que la documentación las marque como estables. |

El registro de capacidades es la dirección prevista. Los hooks heredados siguen siendo la
ruta más segura para evitar roturas en plugins externos durante la transición. No todas las
subrutas auxiliares exportadas son iguales: prefiere contratos estrechos y documentados frente a exportaciones auxiliares incidentales.

### Formas de plugins

OpenClaw clasifica cada plugin cargado en una forma según su comportamiento real
de registro (no solo por metadatos estáticos):

- **plain-capability**: registra exactamente un tipo de capacidad (por ejemplo, un
  plugin solo de proveedor como `mistral`).
- **hybrid-capability**: registra varios tipos de capacidad (por ejemplo,
  `openai` posee inferencia de texto, voz, comprensión de contenido multimedia y generación
  de imágenes).
- **hook-only**: registra solo hooks (tipados o personalizados), sin capacidades,
  herramientas, comandos ni servicios.
- **non-capability**: registra herramientas, comandos, servicios o rutas, pero no
  capacidades.

Usa `openclaw plugins inspect <id>` para ver la forma de un plugin y el desglose
de capacidades. Consulta [Referencia de la CLI](/es/cli/plugins#inspect) para más detalles.

### Hooks heredados

El hook `before_agent_start` sigue siendo compatible como ruta de compatibilidad para
plugins solo con hooks. Los plugins heredados del mundo real siguen dependiendo de él.

Dirección:

- mantenerlo funcionando
- documentarlo como heredado
- preferir `before_model_resolve` para trabajo de anulación de modelo/proveedor
- preferir `before_prompt_build` para trabajo de mutación del prompt
- eliminarlo solo cuando baje el uso real y la cobertura de fixtures demuestre seguridad en la migración

### Señales de compatibilidad

Cuando ejecutes `openclaw doctor` o `openclaw plugins inspect <id>`, puedes ver
una de estas etiquetas:

| Señal                     | Significado                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuración se analiza bien y los plugins se resuelven                       |
| **compatibility advisory** | El plugin usa un patrón compatible pero más antiguo (p. ej. `hook-only`) |
| **legacy warning**         | El plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | La configuración no es válida o el plugin no se pudo cargar                   |

Ni `hook-only` ni `before_agent_start` romperán tu plugin hoy:
`hook-only` es solo informativo, y `before_agent_start` solo activa una advertencia. Estas
señales también aparecen en `openclaw status --all` y `openclaw plugins doctor`.

## Resumen de arquitectura

El sistema de plugins de OpenClaw tiene cuatro capas:

1. **Manifiesto + descubrimiento**
   OpenClaw encuentra plugins candidatos a partir de rutas configuradas, raíces de espacio de trabajo,
   raíces globales de plugins y plugins integrados. El descubrimiento lee primero
   manifiestos nativos `openclaw.plugin.json` más los manifiestos de bundles compatibles.
2. **Habilitación + validación**
   El núcleo decide si un plugin descubierto está habilitado, deshabilitado, bloqueado o
   seleccionado para una ranura exclusiva como memory.
3. **Carga en tiempo de ejecución**
   Los plugins nativos de OpenClaw se cargan en proceso mediante jiti y registran
   capacidades en un registro central. Los bundles compatibles se normalizan en
   registros del registro sin importar código de tiempo de ejecución.
4. **Consumo de la superficie**
   El resto de OpenClaw lee el registro para exponer herramientas, canales, configuración de proveedor,
   hooks, rutas HTTP, comandos CLI y servicios.

Para la CLI de plugins en concreto, el descubrimiento del comando raíz se divide en dos fases:

- los metadatos de tiempo de análisis provienen de `registerCli(..., { descriptors: [...] })`
- el módulo CLI real del plugin puede seguir siendo lazy y registrarse en la primera invocación

Eso mantiene el código CLI propiedad del plugin dentro del plugin y al mismo tiempo permite que OpenClaw
reserve nombres de comandos raíz antes del análisis.

El límite de diseño importante:

- la validación de manifiesto/configuración debe funcionar a partir de **metadatos de manifiesto/esquema**
  sin ejecutar código del plugin
- el descubrimiento nativo de capacidades puede cargar el código de entrada del plugin de confianza para construir una
  instantánea del registro no activadora
- el comportamiento nativo en tiempo de ejecución proviene de la ruta `register(api)` del módulo del plugin
  con `api.registrationMode === "full"`

Esa separación permite que OpenClaw valide configuración, explique plugins ausentes/deshabilitados y
construya pistas de UI/esquema antes de que el tiempo de ejecución completo esté activo.

### Planificación de activación

La planificación de activación forma parte del plano de control. Los llamantes pueden preguntar qué plugins
son relevantes para un comando, proveedor, canal, ruta, entorno de agente o
capacidad concretos antes de cargar registros más amplios del tiempo de ejecución.

El planificador mantiene compatible el comportamiento actual del manifiesto:

- los campos `activation.*` son pistas explícitas del planificador
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` y los hooks siguen siendo la ruta de respaldo de propiedad del manifiesto
- la API del planificador solo de ids sigue estando disponible para los llamantes existentes
- la API del plan informa etiquetas de razón para que los diagnósticos puedan distinguir pistas explícitas de respaldo de propiedad

No trates `activation` como un hook de ciclo de vida ni como un reemplazo de
`register(...)`. Son metadatos usados para reducir la carga. Prefiere los campos de propiedad
cuando ya describen la relación; usa `activation` solo para pistas adicionales del planificador.

### Plugins de canal y la herramienta compartida de mensajes

Los plugins de canal no necesitan registrar una herramienta separada de enviar/editar/reaccionar para
acciones normales de chat. OpenClaw mantiene una única herramienta compartida `message` en el núcleo, y
los plugins de canal poseen el descubrimiento y la ejecución específicos del canal detrás de ella.

El límite actual es:

- el núcleo posee el host compartido de la herramienta `message`, el cableado del prompt, la
  contabilidad de sesiones/hilos y la distribución de ejecución
- los plugins de canal poseen el descubrimiento de acciones limitadas por alcance, el descubrimiento de capacidades y cualquier fragmento de esquema específico del canal
- los plugins de canal poseen la gramática específica del proveedor para sesiones de conversación, como
  cómo los ids de conversación codifican ids de hilo o heredan de conversaciones padre
- los plugins de canal ejecutan la acción final mediante su adaptador de acciones

Para plugins de canal, la superficie del SDK es
`ChannelMessageActionAdapter.describeMessageTool(...)`. Esa llamada unificada de descubrimiento
permite que un plugin devuelva sus acciones visibles, capacidades y contribuciones al esquema
juntas para que esas piezas no se desalineen.

Cuando un parámetro específico del canal en la herramienta de mensajes transporta una fuente de contenido multimedia, como una
ruta local o una URL remota de contenido multimedia, el plugin también debe devolver
`mediaSourceParams` desde `describeMessageTool(...)`. El núcleo usa esa lista explícita
para aplicar normalización de rutas del sandbox y pistas de acceso saliente a contenido multimedia
sin codificar de forma rígida nombres de parámetros propiedad del plugin.
Prefiere mapas limitados por acción ahí, no una lista plana a nivel de todo el canal, para que un
parámetro de contenido multimedia solo de perfil no se normalice en acciones no relacionadas como
`send`.

El núcleo pasa el alcance de tiempo de ejecución a ese paso de descubrimiento. Los campos importantes incluyen:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrante de confianza

Eso importa para plugins sensibles al contexto. Un canal puede ocultar o exponer
acciones de mensajes según la cuenta activa, la sala/hilo/mensaje actual o la
identidad de confianza del solicitante sin codificar ramas específicas del canal en la herramienta
`message` del núcleo.

Por eso los cambios de enrutamiento del runner incrustado siguen siendo trabajo del plugin: el runner es
responsable de reenviar la identidad actual de chat/sesión al límite de descubrimiento del plugin
para que la herramienta compartida `message` exponga la superficie correcta propiedad del canal
para el turno actual.

Para asistentes de ejecución propiedad del canal, los plugins integrados deben mantener el tiempo de ejecución
de la ejecución dentro de sus propios módulos de extensión. El núcleo ya no posee los
tiempos de ejecución de acciones de mensajes de Discord, Slack, Telegram o WhatsApp en `src/agents/tools`.
No publicamos subrutas separadas `plugin-sdk/*-action-runtime`, y los
plugins integrados deben importar directamente su propio código local de tiempo de ejecución desde sus
módulos propiedad de la extensión.

El mismo límite se aplica a las superficies del SDK nombradas por proveedor en general: el núcleo no
debe importar barriles auxiliares específicos de canal para Slack, Discord, Signal,
WhatsApp o extensiones similares. Si el núcleo necesita un comportamiento, debe consumir
el propio barril `api.ts` / `runtime-api.ts` del plugin integrado o promover la necesidad
a una capacidad genérica estrecha en el SDK compartido.

En el caso específico de las encuestas, hay dos rutas de ejecución:

- `outbound.sendPoll` es la base compartida para los canales que encajan en el
  modelo común de encuestas
- `actions.handleAction("poll")` es la ruta preferida para semántica de encuestas específica del canal o parámetros adicionales de encuesta

El núcleo ahora aplaza el análisis compartido de encuestas hasta después de que la distribución de encuestas del plugin rechace
la acción, de modo que los controladores de encuestas propiedad del plugin puedan aceptar campos
de encuesta específicos del canal sin quedar bloqueados antes por el analizador genérico de encuestas.

Consulta [internos de la arquitectura de plugins](/es/plugins/architecture-internals) para ver la secuencia completa de inicio.

## Modelo de propiedad de capacidades

OpenClaw trata un Plugin nativo como el límite de propiedad de una **empresa** o una
**funcionalidad**, no como un conjunto desordenado de integraciones no relacionadas.

Eso significa:

- un plugin de empresa debería normalmente poseer todas las superficies de OpenClaw
  de esa empresa
- un plugin de funcionalidad debería normalmente poseer la superficie completa de la funcionalidad que introduce
- los canales deberían consumir capacidades compartidas del núcleo en lugar de reimplementar
  el comportamiento del proveedor de forma ad hoc

<Accordion title="Ejemplos de patrones de propiedad en plugins integrados">
  - **Proveedor de varias capacidades**: `openai` posee inferencia de texto, voz, voz en tiempo real,
    comprensión de contenido multimedia y generación de imágenes. `google` posee inferencia de texto
    además de comprensión de contenido multimedia, generación de imágenes y búsqueda web.
    `qwen` posee inferencia de texto además de comprensión de contenido multimedia y generación de vídeo.
  - **Proveedor de una sola capacidad**: `elevenlabs` y `microsoft` poseen voz;
    `firecrawl` posee obtención web; `minimax` / `mistral` / `moonshot` / `zai` poseen
    backends de comprensión de contenido multimedia.
  - **Plugin de funcionalidad**: `voice-call` posee el transporte de llamadas, herramientas, CLI, rutas
    y el puente de flujo multimedia de Twilio, pero consume capacidades compartidas de voz, transcripción en tiempo real y voz en tiempo real en lugar de importar directamente plugins de proveedor.
</Accordion>

El estado final previsto es:

- OpenAI vive en un solo plugin aunque abarque modelos de texto, voz, imágenes y
  vídeo en el futuro
- otro proveedor puede hacer lo mismo para su propia superficie
- a los canales no les importa qué plugin del proveedor posee el proveedor; consumen el
  contrato de capacidad compartida expuesto por el núcleo

Esta es la distinción clave:

- **plugin** = límite de propiedad
- **capacidad** = contrato del núcleo que varios plugins pueden implementar o consumir

Así que, si OpenClaw añade un nuevo dominio como vídeo, la primera pregunta no es
“¿qué proveedor debería codificar rígidamente la gestión de vídeo?” La primera pregunta es
“¿cuál es el contrato central de capacidad de vídeo?” Una vez que ese contrato existe, los plugins de proveedor
pueden registrarse contra él y los plugins de canal/funcionalidad pueden consumirlo.

Si la capacidad aún no existe, el movimiento correcto suele ser:

1. definir la capacidad que falta en el núcleo
2. exponerla a través de la API/tiempo de ejecución del plugin de manera tipada
3. conectar canales/funcionalidades contra esa capacidad
4. dejar que los plugins de proveedor registren implementaciones

Esto mantiene explícita la propiedad al tiempo que evita que el comportamiento del núcleo dependa de un
único proveedor o de una ruta de código puntual específica de plugin.

### Capas de capacidades

Usa este modelo mental al decidir dónde debe ir el código:

- **capa central de capacidades**: orquestación compartida, política, respaldo, reglas de
  fusión de configuración, semántica de entrega y contratos tipados
- **capa de plugin de proveedor**: API específicas del proveedor, autenticación, catálogos de modelos, síntesis
  de voz, generación de imágenes, futuros backends de vídeo, endpoints de uso
- **capa de plugin de canal/funcionalidad**: integración Slack/Discord/voice-call/etc.
  que consume capacidades del núcleo y las presenta en una superficie

Por ejemplo, TTS sigue esta forma:

- el núcleo posee la política de TTS en tiempo de respuesta, el orden de respaldo, preferencias y entrega por canal
- `openai`, `elevenlabs` y `microsoft` poseen las implementaciones de síntesis
- `voice-call` consume el asistente de tiempo de ejecución de TTS para telefonía

Ese mismo patrón debería preferirse para capacidades futuras.

### Ejemplo de plugin de empresa con varias capacidades

Un plugin de empresa debe sentirse cohesivo desde fuera. Si OpenClaw tiene contratos compartidos
para modelos, voz, transcripción en tiempo real, voz en tiempo real, comprensión de contenido multimedia,
generación de imágenes, generación de vídeo, obtención web y búsqueda web,
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
      // hooks de autenticación/catálogo de modelos/tiempo de ejecución
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
        // lógica de credenciales + obtención
      }),
    );
  },
};

export default plugin;
```

Lo importante no son los nombres exactos de los asistentes. Importa la forma:

- un plugin posee la superficie del proveedor
- el núcleo sigue poseyendo los contratos de capacidad
- los plugins de canal y funcionalidad consumen asistentes `api.runtime.*`, no código del proveedor
- las pruebas de contrato pueden afirmar que el plugin registró las capacidades que
  afirma poseer

### Ejemplo de capacidad: comprensión de vídeo

OpenClaw ya trata la comprensión de imagen/audio/vídeo como una sola
capacidad compartida. El mismo modelo de propiedad se aplica ahí:

1. el núcleo define el contrato de comprensión de contenido multimedia
2. los plugins de proveedor registran `describeImage`, `transcribeAudio` y
   `describeVideo` según corresponda
3. los plugins de canal y funcionalidad consumen el comportamiento compartido del núcleo en lugar de
   conectarse directamente al código del proveedor

Eso evita incorporar en el núcleo las suposiciones de vídeo de un proveedor concreto. El plugin posee
la superficie del proveedor; el núcleo posee el contrato de capacidad y el comportamiento de respaldo.

La generación de vídeo ya usa esa misma secuencia: el núcleo posee el contrato tipado
de capacidad y el asistente de tiempo de ejecución, y los plugins de proveedor registran
implementaciones `api.registerVideoGenerationProvider(...)` contra él.

¿Necesitas una lista concreta de comprobación para el despliegue? Consulta
[Capability Cookbook](/es/plugins/architecture).

## Contratos y aplicación

La superficie de la API de plugins es intencionadamente tipada y centralizada en
`OpenClawPluginApi`. Ese contrato define los puntos de registro compatibles y
los asistentes de tiempo de ejecución en los que un plugin puede apoyarse.

Por qué importa esto:

- los autores de plugins obtienen un estándar interno estable
- el núcleo puede rechazar duplicidades de propiedad, como dos plugins registrando el mismo
  id de proveedor
- el inicio puede mostrar diagnósticos procesables para registros mal formados
- las pruebas de contrato pueden imponer la propiedad de plugins integrados y evitar derivas silenciosas

Hay dos capas de aplicación:

1. **aplicación del registro en tiempo de ejecución**
   El registro de plugins valida los registros a medida que se cargan los plugins. Ejemplos:
   ids duplicados de proveedor, ids duplicados de proveedor de voz y registros mal formados
   producen diagnósticos del plugin en lugar de comportamiento indefinido.
2. **pruebas de contrato**
   Los plugins integrados se capturan en registros de contrato durante las ejecuciones de pruebas para que
   OpenClaw pueda afirmar explícitamente la propiedad. Hoy esto se usa para proveedores
   de modelos, proveedores de voz, proveedores de búsqueda web y propiedad de registros integrados.

El efecto práctico es que OpenClaw sabe, de antemano, qué plugin posee qué
superficie. Eso permite que el núcleo y los canales se compongan sin fricción porque la propiedad está
declarada, tipada y es comprobable, en lugar de implícita.

### Qué pertenece a un contrato

Los buenos contratos de plugins son:

- tipados
- pequeños
- específicos de capacidad
- propiedad del núcleo
- reutilizables por varios plugins
- consumibles por canales/funcionalidades sin conocimiento del proveedor

Los malos contratos de plugins son:

- política específica de proveedor oculta en el núcleo
- vías de escape puntuales de plugins que omiten el registro
- código de canal que accede directamente a una implementación de proveedor
- objetos de tiempo de ejecución ad hoc que no forman parte de `OpenClawPluginApi` o
  `api.runtime`

En caso de duda, eleva el nivel de abstracción: define primero la capacidad y luego
deja que los plugins se conecten a ella.

## Modelo de ejecución

Los plugins nativos de OpenClaw se ejecutan **en proceso** con el Gateway. No están
aislados. Un Plugin nativo cargado tiene el mismo límite de confianza a nivel de proceso que el código del núcleo.

Implicaciones:

- un Plugin nativo puede registrar herramientas, controladores de red, hooks y servicios
- un fallo en un Plugin nativo puede hacer caer o desestabilizar el gateway
- un Plugin nativo malicioso equivale a ejecución arbitraria de código dentro del
  proceso de OpenClaw

Los bundles compatibles son más seguros por defecto porque OpenClaw actualmente los trata
como paquetes de metadatos/contenido. En las versiones actuales, eso significa sobre todo
Skills incluidas.

Usa listas de permitidos y rutas explícitas de instalación/carga para plugins no integrados. Trata
los plugins del espacio de trabajo como código de tiempo de desarrollo, no como valores predeterminados de producción.

Para nombres de paquetes del espacio de trabajo integrados, mantén el id del plugin anclado en el
nombre npm: `@openclaw/<id>` de forma predeterminada, o un sufijo tipado aprobado como
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` cuando
el paquete expone intencionadamente un rol de plugin más estrecho.

Nota importante sobre confianza:

- `plugins.allow` confía en **ids de plugin**, no en la procedencia de la fuente.
- Un plugin del espacio de trabajo con el mismo id que un plugin integrado sombrea intencionadamente
  la copia integrada cuando ese plugin del espacio de trabajo está habilitado/en la lista de permitidos.
- Esto es normal y útil para desarrollo local, pruebas de parches y correcciones urgentes.
- La confianza en plugins integrados se resuelve a partir de la instantánea de la fuente —el manifiesto y el
  código en disco en el momento de carga— en lugar de metadatos de instalación. Un registro de instalación
  dañado o sustituido no puede ampliar silenciosamente la superficie de confianza de un plugin integrado
  más allá de lo que declara la fuente real.

## Límite de exportación

OpenClaw exporta capacidades, no comodidad de implementación.

Mantén público el registro de capacidades. Recorta las exportaciones auxiliares que no son contrato:

- subrutas auxiliares específicas de plugins integrados
- subrutas de infraestructura de tiempo de ejecución no pensadas como API pública
- asistentes de conveniencia específicos de proveedor
- asistentes de configuración/incorporación que son detalles de implementación

Algunas subrutas auxiliares de plugins integrados todavía permanecen en el mapa de exportación del SDK
generado por compatibilidad y mantenimiento de plugins integrados. Ejemplos actuales incluyen
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` y varias superficies `plugin-sdk/matrix*`. Trátalas como
exportaciones reservadas de detalle de implementación, no como el patrón recomendado del SDK para
nuevos plugins de terceros.

## Internos y referencia

Para la canalización de carga, el modelo de registro, los hooks de tiempo de ejecución de proveedores, las rutas HTTP del Gateway,
los esquemas de la herramienta de mensajes, la resolución de destinos de canal, los catálogos de proveedores,
los plugins de motor de contexto y la guía para añadir una nueva capacidad, consulta
[internos de la arquitectura de plugins](/es/plugins/architecture-internals).

## Relacionado

- [Crear plugins](/es/plugins/building-plugins)
- [Configuración del SDK de Plugin](/es/plugins/sdk-setup)
- [Manifiesto de Plugin](/es/plugins/manifest)
