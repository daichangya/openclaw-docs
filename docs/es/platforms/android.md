---
read_when:
    - Emparejar o volver a conectar el nodo Android
    - Depurar el descubrimiento o la autenticación del gateway en Android
    - Verificar la paridad del historial de chat entre clientes
summary: 'App de Android (node): guía operativa de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: app de Android
x-i18n:
    generated_at: "2026-04-25T13:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** La app de Android aún no se ha publicado públicamente. El código fuente está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) en `apps/android`. Puedes compilarla tú mismo con Java 17 y el SDK de Android (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.

## Estado de compatibilidad

- Rol: app complementaria de nodo (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Primeros pasos](/es/start/getting-started) + [Pairing](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [protocolo del Gateway](/es/gateway/protocol) (nodos + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) reside en el host del Gateway. Consulta [Gateway](/es/gateway).

## Guía operativa de conexión

App de nodo Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivo (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL `wss://` del Gateway con un endpoint TLS real
- `ws://` en texto claro sigue siendo compatible en direcciones LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina “principal”.
- El dispositivo/emulador Android puede alcanzar el WebSocket del gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Wide-Area Bonjour / unicast DNS-SD (consulta abajo), **o**
  - Host/puerto manual del gateway (respaldo)
- El emparejamiento móvil por tailnet/público **no** usa endpoints `ws://` de IP de tailnet sin procesar. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Inicia el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma en los registros que ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android mediante Tailscale, prefiere Serve/Funnel en lugar de un enlace directo de tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un endpoint seguro `wss://` / `https://`. Una configuración simple de `gateway.bind: "tailnet"` no es suficiente para el primer emparejamiento remoto de Android a menos que también termines TLS por separado.

### 2) Verifica el descubrimiento (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el endpoint de servicio resuelto en lugar de pistas solo de TXT.

#### Descubrimiento por tailnet (Viena ⇄ Londres) mediante unicast DNS-SD

El descubrimiento NSD/mDNS de Android no cruza redes. Si tu nodo Android y el gateway están en redes distintas pero conectados mediante Tailscale, usa Wide-Area Bonjour / unicast DNS-SD en su lugar.

El descubrimiento por sí solo no es suficiente para el emparejamiento de Android por tailnet/público. La ruta descubierta sigue necesitando un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura split DNS de Tailscale para el dominio elegido apuntando a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conéctate desde Android

En la app de Android:

- La app mantiene viva su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Connect**.
- Usa el modo **Setup Code** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Advanced controls**. Para hosts LAN privados, `ws://` sigue funcionando. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse:

- Endpoint manual (si está habilitado), o en caso contrario
- El último gateway descubierto (por mejor esfuerzo).

### 4) Aprueba el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Pairing](/es/channels/pairing).

Opcional: si el nodo Android siempre se conecta desde una subred fuertemente controlada,
puedes habilitar la aprobación automática del nodo en el primer emparejamiento con CIDR explícitos o IP exactas:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está desactivado de forma predeterminada. Solo se aplica al emparejamiento nuevo de `role: node` con
ningún alcance solicitado. El emparejamiento de operador/navegador y cualquier cambio de rol, alcance, metadatos o
clave pública sigue requiriendo aprobación manual.

### 5) Verifica que el nodo está conectado

- Mediante el estado de nodos:

  ```bash
  openclaw nodes status
  ```

- Mediante Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historial

La pestaña Chat de Android admite selección de sesión (predeterminada `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas de directivas en línea se
  eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto sin formato (incluidas
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y
  bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo
  se eliminan, las filas del asistente compuestas solo por tokens silenciosos como `NO_REPLY` /
  `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por marcadores de posición)
- Enviar: `chat.send`
- Actualizaciones push (por mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host Canvas del Gateway (recomendado para contenido web)

Si quieres que el nodo muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el nodo al host canvas del Gateway.

Nota: los nodos cargan canvas desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el nodo hacia él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP de tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos.
El host A2UI vive en `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al andamiaje predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`)

Comandos de cámara (solo en primer plano; limitados por permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Nodo de cámara](/es/nodes/camera) para ver parámetros y asistentes de CLI.

### 8) Voice + superficie ampliada de comandos de Android

- Voice: Android usa un único flujo de micrófono activado/desactivado en la pestaña Voice con captura de transcripción y reproducción de `talk.speak`. El TTS local del sistema se usa solo cuando `talk.speak` no está disponible. Voice se detiene cuando la app sale del primer plano.
- Los interruptores de activación por voz/modo talk están eliminados actualmente de la UX/tiempo de ejecución de Android.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo + permisos):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android admite iniciar OpenClaw desde el activador del asistente del sistema (Google
Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask
OpenClaw..." abre la app y entrega el prompt al compositor del chat.

Esto usa metadatos de **App Actions** de Android declarados en el manifiesto de la app. No
se necesita configuración adicional en el lado del gateway: la intención del asistente se
gestiona por completo en la app de Android y se reenvía como un mensaje de chat normal.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services
y de si el usuario ha configurado OpenClaw como la app de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles te permiten delimitar qué notificaciones se reenvían y cuándo.

| Clave                              | Tipo           | Descripción                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Solo reenvía notificaciones de estos nombres de paquete. Si está configurado, todos los demás paquetes se ignoran.      |
| `notifications.denyPackages`     | string[]       | Nunca reenvía notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas silenciosas (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas silenciosas.                                                                        |
| `notifications.rateLimit`        | number         | Número máximo de notificaciones reenviadas por paquete por minuto. Las notificaciones en exceso se descartan.         |

El selector de notificaciones también usa un comportamiento más seguro para los eventos de notificación reenviados, evitando el reenvío accidental de notificaciones sensibles del sistema.

Ejemplo de configuración:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
El reenvío de notificaciones requiere el permiso Android Notification Listener. La app solicita esto durante la configuración inicial.
</Note>

## Relacionado

- [app de iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Solución de problemas del nodo Android](/es/nodes/troubleshooting)
