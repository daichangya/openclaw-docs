---
read_when:
    - Trabajo en funciones o Webhooks de Zalo
summary: Estado de compatibilidad, capacidades y configuración del bot de Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Estado: experimental. Se admiten mensajes directos. La sección de [Capacidades](#capabilities) a continuación refleja el comportamiento actual de los bots de Marketplace.

## Plugin incluido

Zalo se incluye como Plugin integrado en las versiones actuales de OpenClaw, por lo que las compilaciones empaquetadas normales no necesitan una instalación separada.

Si usas una compilación más antigua o una instalación personalizada que excluye Zalo, instálalo manualmente:

- Instalar mediante CLI: `openclaw plugins install @openclaw/zalo`
- O desde una checkout del código fuente: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalles: [Plugins](/es/tools/plugin)

## Configuración rápida (principiantes)

1. Asegúrate de que el Plugin de Zalo esté disponible.
   - Las versiones empaquetadas actuales de OpenClaw ya lo incluyen.
   - Las instalaciones antiguas/personalizadas pueden agregarlo manualmente con los comandos anteriores.
2. Configura el token:
   - Entorno: `ZALO_BOT_TOKEN=...`
   - O configuración: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicia el gateway (o termina la configuración).
4. El acceso por mensajes directos usa emparejamiento de forma predeterminada; aprueba el código de emparejamiento en el primer contacto.

Configuración mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Qué es

Zalo es una aplicación de mensajería centrada en Vietnam; su API de bot permite que el Gateway ejecute un bot para conversaciones 1:1.
Es una buena opción para soporte o notificaciones cuando quieres un enrutamiento determinista de vuelta a Zalo.

Esta página refleja el comportamiento actual de OpenClaw para los **bots de Zalo Bot Creator / Marketplace**.
Los **bots de Zalo Official Account (OA)** pertenecen a otra superficie de producto de Zalo y pueden comportarse de manera diferente.

- Un canal de la API de Zalo Bot propiedad del Gateway.
- Enrutamiento determinista: las respuestas vuelven a Zalo; el modelo nunca elige canales.
- Los mensajes directos comparten la sesión principal del agente.
- La sección de [Capacidades](#capabilities) a continuación muestra la compatibilidad actual de los bots de Marketplace.

## Configuración (ruta rápida)

### 1) Crear un token de bot (Zalo Bot Platform)

1. Ve a [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e inicia sesión.
2. Crea un nuevo bot y configura sus ajustes.
3. Copia el token completo del bot (normalmente `numeric_id:secret`). En los bots de Marketplace, el token de ejecución utilizable puede aparecer en el mensaje de bienvenida del bot después de su creación.

### 2) Configurar el token (entorno o configuración)

Ejemplo:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Si más adelante pasas a una superficie de bot de Zalo donde los grupos estén disponibles, puedes agregar configuración específica de grupos como `groupPolicy` y `groupAllowFrom` de forma explícita. Para el comportamiento actual de los bots de Marketplace, consulta [Capacidades](#capabilities).

Opción de entorno: `ZALO_BOT_TOKEN=...` (solo funciona para la cuenta predeterminada).

Compatibilidad con varias cuentas: usa `channels.zalo.accounts` con tokens por cuenta y `name` opcional.

3. Reinicia el gateway. Zalo se inicia cuando se resuelve un token (entorno o configuración).
4. El acceso por mensajes directos usa emparejamiento de forma predeterminada. Aprueba el código cuando se contacte al bot por primera vez.

## Cómo funciona (comportamiento)

- Los mensajes entrantes se normalizan en el sobre compartido del canal con marcadores de posición de contenido multimedia.
- Las respuestas siempre se enrutan de vuelta al mismo chat de Zalo.
- Long-polling de forma predeterminada; modo Webhook disponible con `channels.zalo.webhookUrl`.

## Límites

- El texto saliente se divide en fragmentos de 2000 caracteres (límite de la API de Zalo).
- Las descargas/cargas de contenido multimedia están limitadas por `channels.zalo.mediaMaxMb` (predeterminado: 5).
- El streaming está bloqueado de forma predeterminada porque el límite de 2000 caracteres lo hace menos útil.

## Control de acceso (mensajes directos)

### Acceso por mensajes directos

- Predeterminado: `channels.zalo.dmPolicy = "pairing"`. Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueben (los códigos caducan después de 1 hora).
- Aprobar mediante:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- El emparejamiento es el intercambio de token predeterminado. Detalles: [Emparejamiento](/es/channels/pairing)
- `channels.zalo.allowFrom` acepta IDs numéricos de usuario (no hay búsqueda por nombre de usuario disponible).

## Control de acceso (grupos)

Para los **bots de Zalo Bot Creator / Marketplace**, la compatibilidad con grupos no estaba disponible en la práctica porque el bot no podía añadirse a un grupo en absoluto.

Eso significa que las claves de configuración relacionadas con grupos que aparecen a continuación existen en el esquema, pero no eran utilizables para los bots de Marketplace:

- `channels.zalo.groupPolicy` controla el manejo entrante de grupos: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe qué IDs de remitente pueden activar el bot en grupos.
- Si `groupAllowFrom` no está configurado, Zalo usa `allowFrom` como respaldo para las comprobaciones del remitente.
- Nota de ejecución: si `channels.zalo` falta por completo, la ejecución aún usa como respaldo `groupPolicy="allowlist"` por seguridad.

Los valores de política de grupo (cuando el acceso a grupos está disponible en la superficie de tu bot) son:

- `groupPolicy: "disabled"` — bloquea todos los mensajes de grupo.
- `groupPolicy: "open"` — permite a cualquier miembro del grupo (con restricción por mención).
- `groupPolicy: "allowlist"` — valor predeterminado de cierre por fallo; solo se aceptan remitentes permitidos.

Si usas una superficie de producto de bot de Zalo diferente y has verificado un comportamiento de grupo funcional, documéntalo por separado en lugar de asumir que coincide con el flujo de bots de Marketplace.

## Long-polling frente a Webhook

- Predeterminado: long-polling (no se requiere URL pública).
- Modo Webhook: establece `channels.zalo.webhookUrl` y `channels.zalo.webhookSecret`.
  - El secreto del Webhook debe tener entre 8 y 256 caracteres.
  - La URL del Webhook debe usar HTTPS.
  - Zalo envía eventos con la cabecera `X-Bot-Api-Secret-Token` para su verificación.
  - El HTTP del Gateway maneja las solicitudes de Webhook en `channels.zalo.webhookPath` (predeterminado: la ruta de la URL del Webhook).
  - Las solicitudes deben usar `Content-Type: application/json` (o tipos multimedia `+json`).
  - Los eventos duplicados (`event_name + message_id`) se ignoran durante una ventana breve de repetición.
  - El tráfico en ráfaga se limita por ruta/origen y puede devolver HTTP 429.

**Nota:** `getUpdates` (polling) y Webhook son mutuamente excluyentes según la documentación de la API de Zalo.

## Tipos de mensajes compatibles

Para una instantánea rápida de compatibilidad, consulta [Capacidades](#capabilities). Las notas a continuación agregan detalles donde el comportamiento necesita contexto adicional.

- **Mensajes de texto**: compatibilidad completa con fragmentación en bloques de 2000 caracteres.
- **URL simples en texto**: se comportan como entrada de texto normal.
- **Vistas previas de enlaces / tarjetas de enlaces enriquecidas**: consulta el estado de los bots de Marketplace en [Capacidades](#capabilities); no activaban una respuesta de forma fiable.
- **Mensajes de imagen**: consulta el estado de los bots de Marketplace en [Capacidades](#capabilities); el manejo de imágenes entrantes no era fiable (indicador de escritura sin respuesta final).
- **Stickers**: consulta el estado de los bots de Marketplace en [Capacidades](#capabilities).
- **Notas de voz / archivos de audio / video / archivos adjuntos genéricos**: consulta el estado de los bots de Marketplace en [Capacidades](#capabilities).
- **Tipos no compatibles**: se registran en logs (por ejemplo, mensajes de usuarios protegidos).

## Capacidades

Esta tabla resume el comportamiento actual de los **bots de Zalo Bot Creator / Marketplace** en OpenClaw.

| Feature                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Direct messages             | ✅ Supported                            |
| Groups                      | ❌ Not available for Marketplace bots   |
| Media (inbound images)      | ⚠️ Limited / verify in your environment |
| Media (outbound images)     | ⚠️ Not re-tested for Marketplace bots   |
| Plain URLs in text          | ✅ Supported                            |
| Link previews               | ⚠️ Unreliable for Marketplace bots      |
| Reactions                   | ❌ Not supported                        |
| Stickers                    | ⚠️ No agent reply for Marketplace bots  |
| Voice notes / audio / video | ⚠️ No agent reply for Marketplace bots  |
| File attachments            | ⚠️ No agent reply for Marketplace bots  |
| Threads                     | ❌ Not supported                        |
| Polls                       | ❌ Not supported                        |
| Native commands             | ❌ Not supported                        |
| Streaming                   | ⚠️ Blocked (2000 char limit)            |

## Destinos de entrega (CLI/Cron)

- Usa un ID de chat como destino.
- Ejemplo: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Solución de problemas

**El bot no responde:**

- Comprueba que el token sea válido: `openclaw channels status --probe`
- Verifica que el remitente esté aprobado (emparejamiento o `allowFrom`)
- Revisa los logs del gateway: `openclaw logs --follow`

**El Webhook no recibe eventos:**

- Asegúrate de que la URL del Webhook use HTTPS
- Verifica que el token secreto tenga entre 8 y 256 caracteres
- Confirma que el endpoint HTTP del gateway sea accesible en la ruta configurada
- Comprueba que el polling con `getUpdates` no esté en ejecución (son mutuamente excluyentes)

## Referencia de configuración (Zalo)

Configuración completa: [Configuración](/es/gateway/configuration)

Las claves planas de nivel superior (`channels.zalo.botToken`, `channels.zalo.dmPolicy` y similares) son una abreviatura heredada para una sola cuenta. Prefiere `channels.zalo.accounts.<id>.*` para configuraciones nuevas. Ambas formas siguen documentadas aquí porque existen en el esquema.

Opciones del proveedor:

- `channels.zalo.enabled`: activar/desactivar el inicio del canal.
- `channels.zalo.botToken`: token del bot de Zalo Bot Platform.
- `channels.zalo.tokenFile`: leer el token desde una ruta de archivo normal. Se rechazan los enlaces simbólicos.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (predeterminado: pairing).
- `channels.zalo.allowFrom`: lista de permitidos de mensajes directos (IDs de usuario). `open` requiere `"*"`. El asistente solicitará IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (predeterminado: allowlist). Está presente en la configuración; consulta [Capacidades](#capabilities) y [Control de acceso (grupos)](#access-control-groups) para el comportamiento actual de los bots de Marketplace.
- `channels.zalo.groupAllowFrom`: lista de permitidos de remitentes de grupo (IDs de usuario). Usa `allowFrom` como respaldo cuando no está configurado.
- `channels.zalo.mediaMaxMb`: límite de contenido multimedia entrante/saliente (MB, predeterminado: 5).
- `channels.zalo.webhookUrl`: activar el modo Webhook (requiere HTTPS).
- `channels.zalo.webhookSecret`: secreto del Webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: ruta del Webhook en el servidor HTTP del Gateway.
- `channels.zalo.proxy`: URL de proxy para solicitudes de API.

Opciones de varias cuentas:

- `channels.zalo.accounts.<id>.botToken`: token por cuenta.
- `channels.zalo.accounts.<id>.tokenFile`: archivo de token normal por cuenta. Se rechazan los enlaces simbólicos.
- `channels.zalo.accounts.<id>.name`: nombre para mostrar.
- `channels.zalo.accounts.<id>.enabled`: activar/desactivar cuenta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de mensajes directos por cuenta.
- `channels.zalo.accounts.<id>.allowFrom`: lista de permitidos por cuenta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupos por cuenta. Está presente en la configuración; consulta [Capacidades](#capabilities) y [Control de acceso (grupos)](#access-control-groups) para el comportamiento actual de los bots de Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: lista de permitidos de remitentes de grupo por cuenta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL del Webhook por cuenta.
- `channels.zalo.accounts.<id>.webhookSecret`: secreto del Webhook por cuenta.
- `channels.zalo.accounts.<id>.webhookPath`: ruta del Webhook por cuenta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por cuenta.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento del chat grupal y restricción por mención
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesiones para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y refuerzo de seguridad
