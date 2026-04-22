---
read_when:
    - Refactorización de la UI de mensajes del canal, cargas útiles interactivas o renderizadores nativos del canal
    - Cambiando las capacidades de la herramienta de mensajes, las sugerencias de entrega o los marcadores entre contextos
    - Depuración de la propagación de importación de Discord Carbon o de la carga diferida del tiempo de ejecución del Plugin del canal
summary: Desacoplar la presentación semántica de mensajes de los renderizadores nativos de UI del canal.
title: Plan de refactorización de presentación de canales
x-i18n:
    generated_at: "2026-04-22T04:23:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Plan de refactorización de presentación de canales

## Estado

Implementado para el agente compartido, la CLI, la capacidad del Plugin y las superficies de entrega saliente:

- `ReplyPayload.presentation` transporta UI semántica del mensaje.
- `ReplyPayload.delivery.pin` transporta solicitudes de fijado del mensaje enviado.
- Las acciones de mensaje compartidas exponen `presentation`, `delivery` y `pin` en lugar de `components`, `blocks`, `buttons` o `card` nativos del proveedor.
- El core renderiza o degrada automáticamente la presentación a través de capacidades salientes declaradas por el Plugin.
- Los renderizadores de Discord, Slack, Telegram, Mattermost, Microsoft Teams y Feishu consumen el contrato genérico.
- El código del plano de control del canal de Discord ya no importa contenedores de UI respaldados por Carbon.

La documentación canónica ahora vive en [Presentación de mensajes](/es/plugins/message-presentation).
Mantén este plan como contexto histórico de implementación; actualiza la guía canónica
para cambios de contrato, renderizador o comportamiento de reserva.

## Problema

La UI del canal está actualmente dividida entre varias superficies incompatibles:

- El core controla un hook de renderizado entre contextos con forma de Discord mediante `buildCrossContextComponents`.
- `channel.ts` de Discord puede importar UI nativa mediante `DiscordUiContainer`, lo que introduce dependencias de UI de tiempo de ejecución en el plano de control del Plugin del canal.
- El agente y la CLI exponen vías de escape de carga útil nativa como `components` de Discord, `blocks` de Slack, `buttons` de Telegram o Mattermost y `card` de Teams o Feishu.
- `ReplyPayload.channelData` transporta tanto sugerencias de transporte como sobres de UI nativa.
- El modelo genérico `interactive` existe, pero es más limitado que los diseños más ricos ya usados por Discord, Slack, Teams, Feishu, LINE, Telegram y Mattermost.

Esto hace que el core conozca formas de UI nativas, debilita la carga diferida del tiempo de ejecución del Plugin y da a los agentes demasiadas formas específicas del proveedor de expresar la misma intención de mensaje.

## Objetivos

- El core decide la mejor presentación semántica para un mensaje a partir de las capacidades declaradas.
- Las extensiones declaran capacidades y renderizan la presentación semántica en cargas útiles de transporte nativas.
- La UI de Control web sigue separada de la UI nativa del chat.
- Las cargas útiles nativas del canal no se exponen a través de la superficie compartida del agente o la CLI.
- Las funciones de presentación no compatibles se degradan automáticamente a la mejor representación de texto.
- El comportamiento de entrega, como fijar un mensaje enviado, es metadato genérico de entrega, no presentación.

## No objetivos

- No habrá shim de compatibilidad retroactiva para `buildCrossContextComponents`.
- No habrá vías de escape nativas públicas para `components`, `blocks`, `buttons` o `card`.
- No habrá importaciones en el core de bibliotecas de UI nativas del canal.
- No habrá seams de SDK específicas del proveedor para canales incluidos.

## Modelo objetivo

Añadir un campo `presentation` controlado por el core a `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` pasa a ser un subconjunto de `presentation` durante la migración:

- El bloque de texto `interactive` se asigna a `presentation.blocks[].type = "text"`.
- El bloque de botones `interactive` se asigna a `presentation.blocks[].type = "buttons"`.
- El bloque de selección `interactive` se asigna a `presentation.blocks[].type = "select"`.

Los esquemas externos del agente y la CLI ahora usan `presentation`; `interactive` sigue siendo un helper interno heredado de análisis/renderizado para productores de respuestas existentes.

## Metadatos de entrega

Añadir un campo `delivery` controlado por el core para el comportamiento de envío que no es UI.

```ts
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

Semántica:

- `delivery.pin = true` significa fijar el primer mensaje entregado correctamente.
- `notify` usa `false` como valor predeterminado.
- `required` usa `false` como valor predeterminado; los canales no compatibles o el fallo al fijar degradan automáticamente al continuar con la entrega.
- Las acciones manuales de mensaje `pin`, `unpin` y `list-pins` se mantienen para mensajes existentes.

La vinculación actual de tema ACP de Telegram debería pasar de `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contrato de capacidades del tiempo de ejecución

Añadir hooks de renderizado de presentación y entrega al adaptador saliente del tiempo de ejecución, no al Plugin del canal del plano de control.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportamiento del core:

- Resolver el canal de destino y el adaptador de tiempo de ejecución.
- Consultar las capacidades de presentación.
- Degradar bloques no compatibles antes de renderizar.
- Llamar a `renderPresentation`.
- Si no existe renderizador, convertir la presentación en texto de reserva.
- Tras un envío correcto, llamar a `pinDeliveredMessage` cuando se solicite `delivery.pin` y sea compatible.

## Asignación por canal

Discord:

- Renderizar `presentation` a components v2 y contenedores Carbon en módulos solo de tiempo de ejecución.
- Mantener los helpers de color de acento en módulos ligeros.
- Eliminar importaciones de `DiscordUiContainer` del código del plano de control del Plugin del canal.

Slack:

- Renderizar `presentation` a Block Kit.
- Eliminar la entrada `blocks` del agente y la CLI.

Telegram:

- Renderizar texto, contexto y divisores como texto.
- Renderizar acciones y selección como teclados inline cuando esté configurado y permitido para la superficie de destino.
- Usar texto de reserva cuando los botones inline estén deshabilitados.
- Mover el fijado de tema ACP a `delivery.pin`.

Mattermost:

- Renderizar acciones como botones interactivos cuando esté configurado.
- Renderizar los demás bloques como texto de reserva.

Microsoft Teams:

- Renderizar `presentation` a Adaptive Cards.
- Mantener las acciones manuales `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` si el soporte de Graph es confiable para la conversación de destino.

Feishu:

- Renderizar `presentation` a tarjetas interactivas.
- Mantener las acciones manuales `pin`/`unpin`/`list-pins`.
- Implementar opcionalmente `pinDeliveredMessage` para fijado de mensajes enviados si el comportamiento de la API es confiable.

LINE:

- Renderizar `presentation` a mensajes Flex o template cuando sea posible.
- Recurrir a texto para bloques no compatibles.
- Eliminar cargas útiles de UI de LINE de `channelData`.

Canales simples o limitados:

- Convertir la presentación a texto con formato conservador.

## Pasos de refactorización

1. Volver a aplicar la corrección de lanzamiento de Discord que separa `ui-colors.ts` de la UI respaldada por Carbon y elimina `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Añadir `presentation` y `delivery` a `ReplyPayload`, la normalización de carga útil saliente, los resúmenes de entrega y las cargas útiles de hooks.
3. Añadir el esquema `MessagePresentation` y helpers de análisis en una subruta estrecha de SDK/tiempo de ejecución.
4. Reemplazar las capacidades de mensaje `buttons`, `cards`, `components` y `blocks` por capacidades semánticas de presentación.
5. Añadir hooks del adaptador saliente del tiempo de ejecución para renderizado de presentación y fijado de entrega.
6. Reemplazar la construcción de componentes entre contextos por `buildCrossContextPresentation`.
7. Eliminar `src/infra/outbound/channel-adapters.ts` y quitar `buildCrossContextComponents` de los tipos del Plugin del canal.
8. Cambiar `maybeApplyCrossContextMarker` para que adjunte `presentation` en lugar de parámetros nativos.
9. Actualizar las rutas de envío de plugin-dispatch para que consuman solo presentación semántica y metadatos de entrega.
10. Eliminar parámetros nativos de carga útil del agente y la CLI: `components`, `blocks`, `buttons` y `card`.
11. Eliminar helpers de SDK que crean esquemas nativos de herramientas de mensaje, sustituyéndolos por helpers de esquema de presentación.
12. Eliminar sobres de UI/nativos de `channelData`; mantener solo metadatos de transporte hasta revisar cada campo restante.
13. Migrar renderizadores de Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu y LINE.
14. Actualizar la documentación de la CLI de mensajes, páginas de canales, SDK de Plugin y libro de recetas de capacidades.
15. Ejecutar perfilado de propagación de importaciones para Discord y puntos de entrada de canales afectados.

Los pasos 1-11 y 13-14 están implementados en esta refactorización para el agente compartido, la CLI, las capacidades del Plugin y los contratos del adaptador saliente. El paso 12 sigue siendo una limpieza interna más profunda para sobres de transporte `channelData` privados del proveedor. El paso 15 sigue pendiente como validación posterior si queremos cifras cuantificadas de propagación de importaciones más allá de la puerta de tipos/pruebas.

## Pruebas

Añadir o actualizar:

- Pruebas de normalización de presentación.
- Pruebas de degradación automática de presentación para bloques no compatibles.
- Pruebas de marcadores entre contextos para plugin-dispatch y rutas de entrega del core.
- Pruebas de matriz de renderizado por canal para Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE y texto de reserva.
- Pruebas del esquema de herramienta de mensajes que demuestren que los campos nativos han desaparecido.
- Pruebas de CLI que demuestren que los indicadores nativos han desaparecido.
- Regresión de carga diferida de importación en el punto de entrada de Discord que cubra Carbon.
- Pruebas de fijado de entrega que cubran Telegram y la reserva genérica.

## Preguntas abiertas

- ¿Debería implementarse `delivery.pin` para Discord, Slack, Microsoft Teams y Feishu en la primera pasada, o solo primero para Telegram?
- ¿Debería `delivery` absorber eventualmente campos existentes como `replyToId`, `replyToCurrent`, `silent` y `audioAsVoice`, o mantenerse centrado en comportamientos posteriores al envío?
- ¿Debería la presentación admitir imágenes o referencias de archivos directamente, o deberían los medios seguir separados de la disposición de UI por ahora?
