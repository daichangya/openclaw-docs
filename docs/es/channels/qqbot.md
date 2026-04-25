---
read_when:
    - Quieres conectar OpenClaw a QQ
    - Necesitas configurar las credenciales de QQ Bot
    - Quieres compatibilidad de QQ Bot con chats grupales o privados
summary: Configuración, ajustes y uso de QQ Bot
title: Bot de QQ
x-i18n:
    generated_at: "2026-04-25T13:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket). El
Plugin admite chat privado C2C, @messages de grupo y mensajes de canal de guild con
contenido multimedia enriquecido (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, canales de guild y
contenido multimedia. Las reacciones y los hilos no son compatibles.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración

1. Ve a la [QQ Open Platform](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato; si sales de la página sin guardarlo,
> tendrás que generar uno nuevo.

4. Agrega el canal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Reinicia el Gateway.

Rutas de configuración interactiva:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurar

Configuración mínima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variables de entorno para la cuenta predeterminada:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret respaldado por archivo:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Notas:

- El respaldo por variables de entorno se aplica solo a la cuenta predeterminada de QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` proporciona solo el
  AppSecret; el AppID ya debe estar establecido en la configuración o en `QQBOT_APP_ID`.
- `clientSecret` también acepta entrada SecretRef, no solo una cadena en texto sin formato.

### Configuración de varias cuentas

Ejecuta varios bots de QQ en una sola instancia de OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Cada cuenta inicia su propia conexión WebSocket y mantiene una caché de tokens independiente
(aislada por `appId`).

Agrega un segundo bot mediante la CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voz (STT / TTS)

La compatibilidad con STT y TTS usa una configuración de dos niveles con respaldo por prioridad:

| Configuración | Específica del Plugin | Respaldo del framework        |
| ------------- | --------------------- | ----------------------------- |
| STT           | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS           | `channels.qqbot.tts`  | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Establece `enabled: false` en cualquiera de los dos para desactivarlo.

Los archivos de voz entrantes de QQ se exponen a los agentes como metadatos de contenido de audio mientras
mantienen los archivos de voz sin procesar fuera de `MediaPaths` genérico. Las respuestas de texto sin formato
`[[audio_as_voice]]` sintetizan TTS y envían un mensaje de voz nativo de QQ cuando TTS está
configurado.

El comportamiento de carga/transcodificación de audio saliente también se puede ajustar con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                   | Descripción        |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grupal        |
| `qqbot:channel:CHANNEL_ID` | Canal de guild     |

> Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el Bot A **no puede**
> usarse para enviar mensajes a través del Bot B.

## Comandos slash

Comandos integrados interceptados antes de la cola de IA:

| Comando        | Descripción                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                                  |
| `/bot-version` | Muestra la versión del framework OpenClaw                                                                           |
| `/bot-help`    | Enumera todos los comandos                                                                                          |
| `/bot-upgrade` | Muestra el enlace a la guía de actualización de QQBot                                                               |
| `/bot-logs`    | Exporta los registros recientes del Gateway como archivo                                                            |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Agrega `?` al final de cualquier comando para ver ayuda de uso (por ejemplo, `/bot-upgrade ?`).

## Arquitectura del motor

QQ Bot se entrega como un motor autocontenido dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de tokens, raíz de almacenamiento multimedia) asociada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que el diagnóstico permanezca separado cuando ejecutas varios bots en un solo Gateway.
- Las rutas entrantes, salientes y del puente del gateway comparten una única raíz de carga multimedia bajo `~/.openclaw/media`, de modo que las cargas, descargas y cachés de transcodificación quedan en un único directorio protegido en lugar de un árbol por subsistema.
- Las credenciales pueden respaldarse y restaurarse como parte de las instantáneas estándar de credenciales de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo emparejamiento con código QR.

## Incorporación con código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de incorporación con código QR para vincular un QQ Bot con OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo, `openclaw channels add --channel qqbot`) y elige el flujo con código QR cuando se te solicite.
2. Escanea el código QR generado con la aplicación del teléfono asociada al QQ Bot de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` dentro del ámbito de cuenta correcto.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de "¿permitir esta acción?" expuestos por la API de QQ Bot) aparecen como prompts nativos de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder desde el cliente QQ sin procesar.

## Solución de problemas

- **El bot responde "gone to Mars":** las credenciales no están configuradas o el Gateway no se ha iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos, y que el
  bot esté habilitado en la QQ Open Platform.
- **La configuración con `--token-file` sigue apareciendo como no configurada:** `--token-file` solo establece
  el AppSecret. También necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar los mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor sea accesible.

## Relacionado

- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)
- [Solución de problemas de canales](/es/channels/troubleshooting)
