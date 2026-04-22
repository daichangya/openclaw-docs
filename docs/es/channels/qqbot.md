---
read_when:
    - Quieres conectar OpenClaw a QQ
    - Necesitas configurar las credenciales del bot de QQ
    - Quieres compatibilidad del bot de QQ para grupos o chats privados
summary: Configuración, ajuste y uso del bot de QQ
title: Bot de QQ
x-i18n:
    generated_at: "2026-04-22T04:20:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# Bot de QQ

El bot de QQ se conecta a OpenClaw mediante la API oficial de QQ Bot (Gateway WebSocket). El
Plugin admite chat privado C2C, @mensajes de grupo y mensajes de canales de servidor con
contenido multimedia enriquecido (imágenes, voz, video, archivos).

Estado: Plugin incluido. Se admiten mensajes directos, chats grupales, canales de servidor y
contenido multimedia. No se admiten reacciones ni hilos.

## Plugin incluido

Las versiones actuales de OpenClaw incluyen QQ Bot, por lo que las compilaciones empaquetadas normales no necesitan
un paso separado de `openclaw plugins install`.

## Configuración

1. Ve a la [plataforma abierta de QQ](https://q.qq.com/) y escanea el código QR con tu
   QQ del teléfono para registrarte / iniciar sesión.
2. Haz clic en **Create Bot** para crear un nuevo bot de QQ.
3. Busca **AppID** y **AppSecret** en la página de configuración del bot y cópialos.

> AppSecret no se almacena en texto sin formato; si abandonas la página sin guardarlo,
> tendrás que generar uno nuevo.

4. Añade el canal:

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

Variables de entorno de la cuenta predeterminada:

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
- `openclaw channels add --channel qqbot --token-file ...` proporciona
  solo el AppSecret; el AppID ya debe estar establecido en la configuración o en `QQBOT_APP_ID`.
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

Añade un segundo bot mediante CLI:

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

El comportamiento de carga/transcodificación de audio saliente también se puede ajustar con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formatos de destino

| Formato                    | Descripción        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privado (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grupal        |
| `qqbot:channel:CHANNEL_ID` | Canal de servidor  |

> Cada bot tiene su propio conjunto de OpenID de usuario. Un OpenID recibido por el bot A **no puede**
> usarse para enviar mensajes mediante el bot B.

## Comandos de barra

Comandos integrados interceptados antes de la cola de la IA:

| Comando        | Descripción                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Prueba de latencia                                                                                             |
| `/bot-version` | Muestra la versión del framework OpenClaw                                                                      |
| `/bot-help`    | Lista todos los comandos                                                                                       |
| `/bot-upgrade` | Muestra el enlace de la guía de actualización de QQBot                                                         |
| `/bot-logs`    | Exporta los registros recientes del Gateway como un archivo                                                    |
| `/bot-approve` | Aprueba una acción pendiente de QQ Bot (por ejemplo, confirmar una carga C2C o de grupo) mediante el flujo nativo. |

Añade `?` a cualquier comando para ver ayuda de uso (por ejemplo `/bot-upgrade ?`).

## Arquitectura del motor

QQ Bot se incluye como un motor autónomo dentro del Plugin:

- Cada cuenta posee una pila de recursos aislada (conexión WebSocket, cliente de API, caché de tokens, raíz de almacenamiento multimedia) identificada por `appId`. Las cuentas nunca comparten estado entrante/saliente.
- El registrador de varias cuentas etiqueta las líneas de registro con la cuenta propietaria para que los diagnósticos sigan siendo separables cuando ejecutes varios bots en un solo Gateway.
- Las rutas entrantes, salientes y del puente del Gateway comparten una única raíz de carga multimedia en `~/.openclaw/media`, por lo que las cargas, descargas y cachés de transcodificación se almacenan en un único directorio protegido en lugar de en un árbol por subsistema.
- Las credenciales pueden respaldarse y restaurarse como parte de las instantáneas estándar de credenciales de OpenClaw; el motor vuelve a adjuntar la pila de recursos de cada cuenta al restaurar sin requerir un nuevo emparejamiento por código QR.

## Incorporación mediante código QR

Como alternativa a pegar `AppID:AppSecret` manualmente, el motor admite un flujo de incorporación con código QR para vincular un bot de QQ a OpenClaw:

1. Ejecuta la ruta de configuración de QQ Bot (por ejemplo `openclaw channels add --channel qqbot`) y elige el flujo de código QR cuando se te solicite.
2. Escanea el código QR generado con la aplicación del teléfono vinculada al bot de QQ de destino.
3. Aprueba el emparejamiento en el teléfono. OpenClaw conserva las credenciales devueltas en `credentials/` dentro del ámbito correcto de la cuenta.

Las solicitudes de aprobación generadas por el propio bot (por ejemplo, flujos de “¿permitir esta acción?” expuestos por la API de QQ Bot) aparecen como solicitudes nativas de OpenClaw que puedes aceptar con `/bot-approve` en lugar de responder desde el cliente sin procesar de QQ.

## Solución de problemas

- **El bot responde "gone to Mars":** las credenciales no están configuradas o el Gateway no se ha iniciado.
- **No hay mensajes entrantes:** verifica que `appId` y `clientSecret` sean correctos y que el
  bot esté habilitado en la plataforma abierta de QQ.
- **La configuración con `--token-file` sigue mostrando que no está configurado:** `--token-file` solo establece
  el AppSecret. Aún necesitas `appId` en la configuración o `QQBOT_APP_ID`.
- **Los mensajes proactivos no llegan:** QQ puede interceptar mensajes iniciados por el bot si
  el usuario no ha interactuado recientemente.
- **La voz no se transcribe:** asegúrate de que STT esté configurado y de que el proveedor sea accesible.
