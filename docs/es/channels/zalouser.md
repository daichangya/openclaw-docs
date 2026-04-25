---
read_when:
    - Configurar Zalo Personal para OpenClaw
    - Depurar el inicio de sesión o el flujo de mensajes de Zalo Personal
summary: Compatibilidad con cuentas personales de Zalo mediante `zca-js` nativo (inicio de sesión con QR), capacidades y configuración
title: Zalo personal
x-i18n:
    generated_at: "2026-04-25T13:42:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Estado: experimental. Esta integración automatiza una **cuenta personal de Zalo** mediante `zca-js` nativo dentro de OpenClaw.

> **Advertencia:** Esta es una integración no oficial y puede provocar la suspensión o el bloqueo de la cuenta. Úsala bajo tu propia responsabilidad.

## Plugin incluido

Zalo Personal se distribuye como Plugin incluido en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usas una compilación antigua o una instalación personalizada que excluye Zalo Personal, instálalo manualmente:

- Instalar mediante la CLI: `openclaw plugins install @openclaw/zalouser`
- O desde un checkout del código fuente: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalles: [Plugins](/es/tools/plugin)

No se requiere ninguna herramienta CLI binaria externa `zca`/`openzca`.

## Configuración rápida (principiantes)

1. Asegúrate de que el Plugin de Zalo Personal esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas o personalizadas pueden añadirlo manualmente con los comandos anteriores.
2. Inicia sesión (QR, en la máquina del Gateway):
   - `openclaw channels login --channel zalouser`
   - Escanea el código QR con la aplicación móvil de Zalo.
3. Habilita el canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicia el Gateway (o termina la configuración).
5. El acceso por mensajes directos usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

## Qué es

- Se ejecuta completamente en proceso mediante `zca-js`.
- Usa escuchas de eventos nativos para recibir mensajes entrantes.
- Envía respuestas directamente a través de la API de JS (texto/multimedia/enlace).
- Diseñado para casos de uso de “cuenta personal” donde la API de bots de Zalo no está disponible.

## Nomenclatura

El id del canal es `zalouser` para dejar claro que esto automatiza una **cuenta personal de usuario de Zalo** (no oficial). Reservamos `zalo` para una posible integración oficial futura con la API de Zalo.

## Encontrar IDs (directorio)

Usa la CLI del directorio para descubrir pares/grupos y sus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Límites

- El texto saliente se divide en fragmentos de ~2000 caracteres (límites del cliente de Zalo).
- El streaming está bloqueado de forma predeterminada.

## Control de acceso (mensajes directos)

`channels.zalouser.dmPolicy` admite: `pairing | allowlist | open | disabled` (predeterminado: `pairing`).

`channels.zalouser.allowFrom` acepta IDs de usuario o nombres. Durante la configuración, los nombres se resuelven a IDs mediante la búsqueda de contactos en proceso del Plugin.

Aprobar mediante:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acceso a grupos (opcional)

- Predeterminado: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Usa `channels.defaults.groupPolicy` para reemplazar el valor predeterminado cuando no esté definido.
- Restringe a una lista de permitidos con:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (las claves deben ser IDs de grupo estables; los nombres se resuelven a IDs al iniciar cuando es posible)
  - `channels.zalouser.groupAllowFrom` (controla qué remitentes de grupos permitidos pueden activar el bot)
- Bloquea todos los grupos: `channels.zalouser.groupPolicy = "disabled"`.
- El asistente de configuración puede solicitar listas de permitidos de grupos.
- Al iniciar, OpenClaw resuelve nombres de grupos/usuarios en las listas de permitidos a IDs y registra la asignación.
- La coincidencia de la lista de permitidos de grupos usa solo IDs de forma predeterminada. Los nombres no resueltos se ignoran para la autorización, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esté habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` es un modo de compatibilidad de emergencia que vuelve a habilitar la coincidencia por nombres de grupo mutables.
- Si `groupAllowFrom` no está definido, el tiempo de ejecución usa `allowFrom` como valor de respaldo para las comprobaciones de remitentes en grupos.
- Las comprobaciones de remitentes se aplican tanto a mensajes normales de grupo como a comandos de control (por ejemplo `/new`, `/reset`).

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Restricción por menciones en grupos

- `channels.zalouser.groups.<group>.requireMention` controla si las respuestas en grupo requieren una mención.
- Orden de resolución: id/nombre exacto del grupo -> slug normalizado del grupo -> `*` -> valor predeterminado (`true`).
- Esto se aplica tanto a grupos en lista de permitidos como al modo de grupos abiertos.
- Citar un mensaje del bot cuenta como una mención implícita para activar el grupo.
- Los comandos de control autorizados (por ejemplo `/new`) pueden omitir la restricción por menciones.
- Cuando se omite un mensaje de grupo porque se requiere mención, OpenClaw lo almacena como historial de grupo pendiente y lo incluye en el siguiente mensaje de grupo procesado.
- El límite del historial de grupo usa por defecto `messages.groupChat.historyLimit` (respaldo `50`). Puedes reemplazarlo por cuenta con `channels.zalouser.historyLimit`.

Ejemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multicuenta

Las cuentas se asignan a perfiles `zalouser` en el estado de OpenClaw. Ejemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Escritura, reacciones y acuses de recibo de entrega

- OpenClaw envía un evento de escritura antes de enviar una respuesta (best-effort).
- La acción de canal de reacción de mensaje `react` es compatible con `zalouser`.
  - Usa `remove: true` para quitar de un mensaje un emoji de reacción específico.
  - Semántica de reacciones: [Reacciones](/es/tools/reactions)
- En los mensajes entrantes que incluyen metadatos de evento, OpenClaw envía acuses de recibido + visto (best-effort).

## Solución de problemas

**El inicio de sesión no se conserva:**

- `openclaw channels status --probe`
- Vuelve a iniciar sesión: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La lista de permitidos/el nombre del grupo no se resolvió:**

- Usa IDs numéricos en `allowFrom`/`groupAllowFrom`/`groups`, o nombres exactos de amigos/grupos.

**Actualizaste desde la configuración antigua basada en CLI:**

- Elimina cualquier suposición antigua sobre un proceso externo `zca`.
- El canal ahora se ejecuta completamente dentro de OpenClaw sin herramientas CLI binarias externas.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chats de grupo y restricción por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo
