---
read_when:
    - Quieres conectar OpenClaw a LINE
    - Necesitas la configuración del Webhook de LINE y de las credenciales
    - Quieres opciones de mensajes específicas de LINE
summary: Configuración, ajuste y uso del Plugin de la API de mensajería LINE
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:19:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE se conecta a OpenClaw mediante la API de mensajería LINE. El Plugin se ejecuta como un receptor de Webhook
en el Gateway y usa tu token de acceso del canal + secreto del canal para
la autenticación.

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, archivos multimedia, ubicaciones, mensajes Flex,
mensajes de plantilla y respuestas rápidas. No se admiten reacciones ni hilos.

## Plugin incluido

LINE se incluye como un Plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones
empaquetadas normales no necesitan una instalación independiente.

Si usas una compilación anterior o una instalación personalizada que excluye LINE, instálalo
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Copia de trabajo local (cuando se ejecuta desde un repositorio git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuración

1. Crea una cuenta de LINE Developers y abre la Consola:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o elige) un proveedor y añade un canal de **Messaging API**.
3. Copia el **Channel access token** y el **Channel secret** desde la configuración del canal.
4. Habilita **Use webhook** en la configuración de Messaging API.
5. Establece la URL del Webhook en tu endpoint del Gateway (se requiere HTTPS):

```
https://gateway-host/line/webhook
```

El Gateway responde a la verificación del Webhook de LINE (GET) y a los eventos entrantes (POST).
Si necesitas una ruta personalizada, establece `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` y actualiza la URL en consecuencia.

Nota de seguridad:

- La verificación de firma de LINE depende del cuerpo (HMAC sobre el cuerpo sin procesar), por lo que OpenClaw aplica límites estrictos de tamaño del cuerpo previos a la autenticación y tiempo de espera antes de la verificación.
- OpenClaw procesa los eventos del Webhook a partir de los bytes sin procesar de la solicitud verificada. Los valores `req.body` transformados por middleware ascendente se ignoran para proteger la integridad de la firma.

## Configurar

Configuración mínima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variables de entorno (solo cuenta predeterminada):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Archivos de token/secreto:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` y `secretFile` deben apuntar a archivos regulares. Se rechazan los enlaces simbólicos.

Varias cuentas:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Control de acceso

Los mensajes directos usan pairing de forma predeterminada. Los remitentes desconocidos reciben un código de pairing y sus
mensajes se ignoran hasta que sean aprobados.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permitidos y políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuario de LINE permitidos para mensajes directos
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuario de LINE permitidos para grupos
- Anulaciones por grupo: `channels.line.groups.<groupId>.allowFrom`
- Nota de ejecución: si `channels.line` falta por completo, la ejecución usa como respaldo `groupPolicy="allowlist"` para las comprobaciones de grupo (incluso si `channels.defaults.groupPolicy` está configurado).

Los ID de LINE distinguen entre mayúsculas y minúsculas. Los ID válidos tienen este aspecto:

- Usuario: `U` + 32 caracteres hexadecimales
- Grupo: `C` + 32 caracteres hexadecimales
- Sala: `R` + 32 caracteres hexadecimales

## Comportamiento de los mensajes

- El texto se divide en fragmentos de 5000 caracteres.
- Se elimina el formato Markdown; los bloques de código y las tablas se convierten en
  tarjetas Flex cuando es posible.
- Las respuestas en streaming se almacenan en búfer; LINE recibe fragmentos completos con una animación
  de carga mientras el agente trabaja.
- Las descargas multimedia están limitadas por `channels.line.mediaMaxMb` (valor predeterminado: 10).

## Datos del canal (mensajes enriquecidos)

Usa `channelData.line` para enviar respuestas rápidas, ubicaciones, tarjetas Flex o mensajes
de plantilla.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

El Plugin de LINE también incluye un comando `/card` para preajustes de mensajes Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Compatibilidad con ACP

LINE admite vínculos de conversación de ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula el chat actual de LINE a una sesión de ACP sin crear un hilo hijo.
- Los vínculos ACP configurados y las sesiones ACP activas vinculadas a una conversación funcionan en LINE igual que en otros canales de conversación.

Consulta [agentes ACP](/es/tools/acp-agents) para obtener más detalles.

## Multimedia saliente

El Plugin de LINE admite el envío de imágenes, videos y archivos de audio mediante la herramienta de mensajes del agente. El contenido multimedia se envía a través de la ruta de entrega específica de LINE con el manejo adecuado de vista previa y seguimiento:

- **Imágenes**: se envían como mensajes de imagen de LINE con generación automática de vista previa.
- **Videos**: se envían con manejo explícito de vista previa y tipo de contenido.
- **Audio**: se envía como mensajes de audio de LINE.

Las URL de multimedia saliente deben ser URL HTTPS públicas. OpenClaw valida el nombre de host de destino antes de entregar la URL a LINE y rechaza destinos de loopback, link-local y redes privadas.

Los envíos multimedia genéricos recurren a la ruta existente solo para imágenes cuando no hay una ruta específica de LINE disponible.

## Solución de problemas

- **La verificación del Webhook falla:** asegúrate de que la URL del Webhook use HTTPS y de que
  `channelSecret` coincida con el de la consola de LINE.
- **No hay eventos entrantes:** confirma que la ruta del Webhook coincida con `channels.line.webhookPath`
  y que el Gateway sea accesible desde LINE.
- **Errores de descarga multimedia:** aumenta `channels.line.mediaMaxMb` si el contenido multimedia supera el
  límite predeterminado.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Pairing](/es/channels/pairing) — autenticación de mensajes directos y flujo de pairing
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
