---
read_when:
    - Cambio de reglas de mensajes de grupo o menciones
summary: Comportamiento y configuración para el manejo de mensajes de grupos de WhatsApp (`mentionPatterns` se comparten entre superficies)
title: Mensajes de grupo
x-i18n:
    generated_at: "2026-04-25T13:41:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Comportamiento y configuración para el manejo de mensajes de grupos de WhatsApp (`mentionPatterns` se comparte entre superficies)

Mensajes de grupo

Cambio de reglas de mensajes de grupo o menciones

Objetivo: permitir que Clawd permanezca en grupos de WhatsApp, se active solo cuando lo mencionen y mantenga ese hilo separado de la sesión de mensajes directos personal.

Nota: `agents.list[].groupChat.mentionPatterns` ahora también se usa en Telegram/Discord/Slack/iMessage; este documento se centra en el comportamiento específico de WhatsApp. Para configuraciones con varios agentes, establece `agents.list[].groupChat.mentionPatterns` por agente (o usa `messages.groupChat.mentionPatterns` como respaldo global).

## Implementación actual (2025-12-03)

- Modos de activación: `mention` (predeterminado) o `always`. `mention` requiere una mención (menciones reales de WhatsApp con @ a través de `mentionedJids`, patrones regex seguros o el E.164 del bot en cualquier parte del texto). `always` activa al agente con cada mensaje, pero solo debe responder cuando pueda aportar valor significativo; de lo contrario devuelve el token de silencio exacto `NO_REPLY` / `no_reply`. Los valores predeterminados se pueden establecer en la configuración (`channels.whatsapp.groups`) y sobrescribir por grupo mediante `/activation`. Cuando se establece `channels.whatsapp.groups`, también actúa como lista de permitidos de grupos (incluye `"*"` para permitir todos).
- Política de grupos: `channels.whatsapp.groupPolicy` controla si se aceptan mensajes de grupo (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (respaldo: `channels.whatsapp.allowFrom` explícito). El valor predeterminado es `allowlist` (bloqueado hasta que agregues remitentes).
- Sesiones por grupo: las claves de sesión tienen el formato `agent:<agentId>:whatsapp:group:<jid>`, por lo que comandos como `/verbose on`, `/trace on` o `/think high` (enviados como mensajes independientes) se limitan a ese grupo; el estado del mensaje directo personal no se modifica. Los Heartbeat se omiten en los hilos de grupo.
- Inyección de contexto: los mensajes de grupo **solo pendientes** (50 de forma predeterminada) que _no_ activaron una ejecución se anteponen bajo `[Chat messages since your last reply - for context]`, con la línea desencadenante bajo `[Current message - respond to this]`. Los mensajes que ya están en la sesión no se vuelven a inyectar.
- Identificación del remitente: cada lote de grupo ahora termina con `[from: Sender Name (+E164)]` para que Pi sepa quién está hablando.
- Efímeros/view-once: los desenvolvemos antes de extraer texto/menciones, por lo que las menciones dentro de ellos siguen activándose.
- Prompt del sistema de grupo: en el primer turno de una sesión de grupo (y cada vez que `/activation` cambia el modo) inyectamos un texto breve en el prompt del sistema como `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Si los metadatos no están disponibles, igualmente le indicamos al agente que es un chat grupal.

## Ejemplo de configuración (WhatsApp)

Agrega un bloque `groupChat` a `~/.openclaw/openclaw.json` para que las menciones por nombre visible funcionen incluso cuando WhatsApp elimina el `@` visual del cuerpo del texto:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Notas:

- Las regex no distinguen entre mayúsculas y minúsculas y usan las mismas protecciones de regex segura que otras superficies de regex de configuración; los patrones no válidos y las repeticiones anidadas inseguras se ignoran.
- WhatsApp sigue enviando menciones canónicas mediante `mentionedJids` cuando alguien toca el contacto, por lo que el respaldo con el número rara vez es necesario, pero es una red de seguridad útil.

### Comando de activación (solo propietario)

Usa el comando de chat grupal:

- `/activation mention`
- `/activation always`

Solo el número del propietario (de `channels.whatsapp.allowFrom`, o el propio E.164 del bot cuando no está configurado) puede cambiar esto. Envía `/status` como mensaje independiente en el grupo para ver el modo de activación actual.

## Cómo usarlo

1. Agrega tu cuenta de WhatsApp (la que ejecuta OpenClaw) al grupo.
2. Di `@openclaw …` (o incluye el número). Solo los remitentes en la lista de permitidos pueden activarlo, a menos que establezcas `groupPolicy: "open"`.
3. El prompt del agente incluirá el contexto reciente del grupo más el marcador final `[from: …]` para que pueda dirigirse a la persona correcta.
4. Las directivas a nivel de sesión (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) se aplican solo a la sesión de ese grupo; envíalas como mensajes independientes para que se registren. Tu sesión personal de mensajes directos permanece independiente.

## Pruebas / verificación

- Prueba manual:
  - Envía una mención `@openclaw` en el grupo y confirma una respuesta que haga referencia al nombre del remitente.
  - Envía una segunda mención y verifica que el bloque de historial se incluya y luego se limpie en el siguiente turno.
- Revisa los registros del Gateway (ejecuta con `--verbose`) para ver entradas `inbound web message` que muestren `from: <groupJid>` y el sufijo `[from: …]`.

## Consideraciones conocidas

- Los Heartbeat se omiten intencionalmente en los grupos para evitar difusiones ruidosas.
- La supresión de eco usa la cadena de lote combinada; si envías el mismo texto dos veces sin menciones, solo la primera recibirá una respuesta.
- Las entradas del almacén de sesiones aparecerán como `agent:<agentId>:whatsapp:group:<jid>` en el almacén de sesiones (`~/.openclaw/agents/<agentId>/sessions/sessions.json` de forma predeterminada); si falta una entrada, simplemente significa que el grupo aún no ha activado una ejecución.
- Los indicadores de escritura en grupos siguen `agents.defaults.typingMode` (predeterminado: `message` cuando no hay mención).

## Relacionado

- [Grupos](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos de difusión](/es/channels/broadcast-groups)
