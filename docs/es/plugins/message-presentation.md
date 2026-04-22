---
read_when:
    - Añadiendo o modificando la representación de tarjetas de mensajes, botones o selectores
    - Creando un Plugin de canal que admita mensajes salientes enriquecidos
    - Cambiando la presentación o las capacidades de entrega de la herramienta de mensajes
    - Depurando regresiones de representación de tarjetas/bloques/componentes específicas del proveedor
summary: Tarjetas de mensajes semánticas, botones, selectores, texto de respaldo e indicaciones de entrega para plugins de canal
title: Presentación de mensajes
x-i18n:
    generated_at: "2026-04-22T04:24:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Presentación de mensajes

La presentación de mensajes es el contrato compartido de OpenClaw para IU de chat saliente enriquecida.
Permite que agentes, comandos de CLI, flujos de aprobación y plugins describan la
intención del mensaje una sola vez, mientras cada Plugin de canal representa la mejor forma nativa que pueda.

Usa presentación para IU de mensajes portátil:

- secciones de texto
- texto pequeño de contexto/pie
- divisores
- botones
- menús de selección
- título y tono de la tarjeta

No añadas nuevos campos nativos de proveedor como `components` de Discord, `blocks` de Slack,
`buttons` de Telegram, `card` de Teams o `card` de Feishu a la herramienta compartida de
mensajes. Esas son salidas del renderizador propiedad del Plugin de canal.

## Contrato

Los autores de plugins importan el contrato público desde:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forma:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semántica de botones:

- `value` es un valor de acción de aplicación que se enruta de vuelta a través de la
  ruta de interacción existente del canal cuando el canal admite controles en los que se puede hacer clic.
- `url` es un botón de enlace. Puede existir sin `value`.
- `label` es obligatorio y también se usa en el texto de respaldo.
- `style` es orientativo. Los renderizadores deben asignar estilos no compatibles a un valor
  predeterminado seguro, no hacer fallar el envío.

Semántica de selección:

- `options[].value` es el valor de aplicación seleccionado.
- `placeholder` es orientativo y puede ser ignorado por canales sin compatibilidad nativa
  con selección.
- Si un canal no admite selectores, el texto de respaldo enumera las etiquetas.

## Ejemplos de productor

Tarjeta simple:

```json
{
  "title": "Aprobación de despliegue",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary está listo para promoverse." },
    { "type": "context", "text": "Compilación 1234, staging aprobado." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Aprobar", "value": "deploy:approve", "style": "success" },
        { "label": "Rechazar", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Botón de enlace solo con URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Las notas de la versión están listas." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Abrir notas", "url": "https://example.com/release" }]
    }
  ]
}
```

Menú de selección:

```json
{
  "title": "Elegir entorno",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Entorno",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Producción", "value": "env:prod" }
      ]
    }
  ]
}
```

Envío por CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Aprobación de despliegue" \
  --presentation '{"title":"Aprobación de despliegue","tone":"warning","blocks":[{"type":"text","text":"Canary está listo."},{"type":"buttons","buttons":[{"label":"Aprobar","value":"deploy:approve","style":"success"},{"label":"Rechazar","value":"deploy:decline","style":"danger"}]}]}'
```

Entrega fijada:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Tema abierto" \
  --pin
```

Entrega fijada con JSON explícito:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrato del renderizador

Los plugins de canal declaran compatibilidad de renderizado en su adaptador saliente:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Los campos de capacidad son intencionalmente booleanos simples. Describen lo que el
renderizador puede hacer interactivo, no todos los límites de la plataforma nativa. Los renderizadores siguen
siendo propietarios de límites específicos de plataforma, como el número máximo de botones, número de bloques y
tamaño de tarjeta.

## Flujo principal de renderizado

Cuando un `ReplyPayload` o acción de mensaje incluye `presentation`, el núcleo:

1. Normaliza la carga de presentación.
2. Resuelve el adaptador saliente del canal de destino.
3. Lee `presentationCapabilities`.
4. Llama a `renderPresentation` cuando el adaptador puede representar la carga.
5. Usa como respaldo texto conservador cuando el adaptador no existe o no puede representar.
6. Envía la carga resultante a través de la ruta normal de entrega del canal.
7. Aplica metadatos de entrega como `delivery.pin` después del primer
   mensaje enviado correctamente.

El núcleo es propietario del comportamiento de respaldo para que los productores puedan seguir siendo agnósticos al canal. Los
plugins de canal son propietarios del renderizado nativo y del manejo de interacciones.

## Reglas de degradación

La presentación debe poder enviarse de forma segura en canales limitados.

El texto de respaldo incluye:

- `title` como primera línea
- bloques `text` como párrafos normales
- bloques `context` como líneas compactas de contexto
- bloques `divider` como separador visual
- etiquetas de botones, incluidas URL para botones de enlace
- etiquetas de opciones de selección

Los controles nativos no compatibles deben degradarse en lugar de hacer fallar todo el envío.
Ejemplos:

- Telegram con botones en línea deshabilitados envía texto de respaldo.
- Un canal sin compatibilidad con selectores enumera las opciones de selección como texto.
- Un botón solo con URL se convierte en un botón de enlace nativo o en una línea URL de respaldo.
- Los fallos opcionales al fijar no hacen fallar el mensaje entregado.

La principal excepción es `delivery.pin.required: true`; si se solicita fijación como
obligatoria y el canal no puede fijar el mensaje enviado, la entrega informa un fallo.

## Asignación de proveedores

Renderizadores incluidos actuales:

| Canal         | Destino de renderizado nativo         | Notas                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componentes y contenedores de componentes | Conserva `channelData.discord.components` heredado para productores existentes de cargas nativas de proveedor, pero los nuevos envíos compartidos deben usar `presentation`. |
| Slack           | Block Kit                           | Conserva `channelData.slack.blocks` heredado para productores existentes de cargas nativas de proveedor, pero los nuevos envíos compartidos deben usar `presentation`.       |
| Telegram        | Texto más teclados en línea          | Los botones/selectores requieren capacidad de botones en línea para la superficie de destino; de lo contrario se usa texto de respaldo.                                         |
| Mattermost      | Texto más props interactivos         | Los demás bloques se degradan a texto.                                                                                                                     |
| Microsoft Teams | Tarjetas adaptables                      | El texto plano de `message` se incluye con la tarjeta cuando se proporcionan ambos.                                                                            |
| Feishu          | Tarjetas interactivas                   | El encabezado de la tarjeta puede usar `title`; el cuerpo evita duplicar ese título.                                                                                  |
| Canales simples  | Texto de respaldo                       | Los canales sin renderizador siguen recibiendo salida legible.                                                                                            |

La compatibilidad con cargas nativas de proveedor es una facilidad de transición para productores de
respuestas existentes. No es una razón para añadir nuevos campos nativos compartidos.

## Presentación frente a InteractiveReply

`InteractiveReply` es el subconjunto interno más antiguo usado por asistentes de aprobación e interacción.
Admite:

- texto
- botones
- selectores

`MessagePresentation` es el contrato compartido canónico de envío. Añade:

- título
- tono
- contexto
- divisor
- botones solo con URL
- metadatos genéricos de entrega mediante `ReplyPayload.delivery`

Usa asistentes de `openclaw/plugin-sdk/interactive-runtime` al conectar código
antiguo:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

El código nuevo debe aceptar o producir directamente `MessagePresentation`.

## Fijación de entrega

Fijar es un comportamiento de entrega, no de presentación. Usa `delivery.pin` en lugar de
campos nativos de proveedor como `channelData.telegram.pin`.

Semántica:

- `pin: true` fija el primer mensaje entregado correctamente.
- `pin.notify` usa `false` como valor predeterminado.
- `pin.required` usa `false` como valor predeterminado.
- Los fallos opcionales al fijar se degradan y dejan intacto el mensaje enviado.
- Los fallos obligatorios al fijar hacen fallar la entrega.
- Los mensajes fragmentados fijan el primer fragmento entregado, no el fragmento final.

Las acciones manuales de mensajes `pin`, `unpin` y `pins` siguen existiendo para
mensajes existentes donde el proveedor admite esas operaciones.

## Lista de verificación para autores de plugins

- Declara `presentation` desde `describeMessageTool(...)` cuando el canal pueda
  representar o degradar de forma segura la presentación semántica.
- Añade `presentationCapabilities` al adaptador saliente de ejecución.
- Implementa `renderPresentation` en código de ejecución, no en código de configuración
  del Plugin del plano de control.
- Mantén las bibliotecas de IU nativa fuera de las rutas calientes de configuración/catálogo.
- Conserva los límites de la plataforma en el renderizador y en las pruebas.
- Añade pruebas de respaldo para botones no compatibles, selectores, botones URL, duplicación de título/texto
  y envíos mixtos de `message` más `presentation`.
- Añade compatibilidad para fijación de entrega mediante `deliveryCapabilities.pin` y
  `pinDeliveredMessage` solo cuando el proveedor pueda fijar el ID del mensaje enviado.
- No expongas nuevos campos nativos de proveedor de tarjeta/bloque/componente/botón mediante
  el esquema compartido de acción de mensajes.

## Documentación relacionada

- [CLI de mensajes](/cli/message)
- [Resumen del SDK de plugins](/es/plugins/sdk-overview)
- [Arquitectura de plugins](/es/plugins/architecture#message-tool-schemas)
- [Plan de refactorización de presentación de canales](/es/plan/ui-channels)
