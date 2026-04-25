---
read_when:
    - Quieres realizar una llamada de voz saliente desde OpenClaw
    - Estás configurando o desarrollando el plugin de llamadas de voz
summary: 'Plugin de llamadas de voz: llamadas salientes + entrantes mediante Twilio/Telnyx/Plivo (instalación del plugin + configuración + CLI)'
title: Plugin de llamadas de voz
x-i18n:
    generated_at: "2026-04-25T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Llamadas de voz para OpenClaw mediante un Plugin. Admite notificaciones salientes y
conversaciones de varios turnos con políticas entrantes.

Proveedores actuales:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferencia XML + voz GetInput)
- `mock` (desarrollo/sin red)

Modelo mental rápido:

- Instalar el Plugin
- Reiniciar Gateway
- Configurar en `plugins.entries.voice-call.config`
- Usar `openclaw voicecall ...` o la herramienta `voice_call`

## Dónde se ejecuta (local vs remoto)

El Plugin de llamadas de voz se ejecuta **dentro del proceso de Gateway**.

Si usas un Gateway remoto, instala/configura el Plugin en la **máquina que ejecuta el Gateway** y luego reinicia el Gateway para cargarlo.

## Instalación

### Opción A: instalar desde npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Después, reinicia el Gateway.

### Opción B: instalar desde una carpeta local (desarrollo, sin copiar)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Después, reinicia el Gateway.

## Configuración

Define la configuración en `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // o "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // o TWILIO_FROM_NUMBER para Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Clave pública del Webhook de Telnyx del Portal Mission Control de Telnyx
            // (cadena Base64; también puede establecerse mediante TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Seguridad del Webhook (recomendado para túneles/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposición pública (elige una)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcional; primer proveedor de transcripción en tiempo real registrado cuando no se establece
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está establecido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // opcional; primer proveedor de voz en tiempo real registrado cuando no se establece
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Comprueba la configuración antes de probar con un proveedor real:

```bash
openclaw voicecall setup
```

La salida predeterminada es legible en registros de chat y sesiones de terminal. Comprueba
si el Plugin está habilitado, si el proveedor y las credenciales están presentes, si la
exposición del Webhook está configurada y si solo hay un modo de audio activo. Usa
`openclaw voicecall setup --json` para scripts.

Para Twilio, Telnyx y Plivo, la configuración debe resolverse a una URL pública de Webhook. Si la
`publicUrl` configurada, la URL del túnel, la URL de Tailscale o la reserva de `serve` se resuelven a
espacio de loopback o de red privada, la configuración falla en lugar de iniciar un proveedor
que no puede recibir Webhooks reales del operador.

Para una prueba rápida sin sorpresas, ejecuta:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

El segundo comando sigue siendo una ejecución de prueba. Añade `--yes` para realizar una llamada
saliente corta de notificación:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Notas:

- Twilio/Telnyx requieren una URL de Webhook **accesible públicamente**.
- Plivo requiere una URL de Webhook **accesible públicamente**.
- `mock` es un proveedor local para desarrollo (sin llamadas de red).
- Si las configuraciones antiguas aún usan `provider: "log"`, `twilio.from` o claves heredadas de OpenAI en `streaming.*`, ejecuta `openclaw doctor --fix` para reescribirlas.
- Telnyx requiere `telnyx.publicKey` (o `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` sea true.
- `skipSignatureVerification` es solo para pruebas locales.
- Si usas el nivel gratuito de ngrok, establece `publicUrl` en la URL exacta de ngrok; la verificación de firma siempre se aplica.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks de Twilio con firmas no válidas **solo** cuando `tunnel.provider="ngrok"` y `serve.bind` es loopback (agente local de ngrok). Úsalo solo para desarrollo local.
- Las URL del nivel gratuito de ngrok pueden cambiar o añadir comportamiento intersticial; si `publicUrl` se desvía, las firmas de Twilio fallarán. Para producción, prefiere un dominio estable o un funnel de Tailscale.
- `realtime.enabled` inicia conversaciones completas de voz a voz; no lo habilites junto con `streaming.enabled`.
- Valores predeterminados de seguridad de streaming:
  - `streaming.preStartTimeoutMs` cierra sockets que nunca envían una trama `start` válida.
- `streaming.maxPendingConnections` limita el total de sockets previos al inicio no autenticados.
- `streaming.maxPendingConnectionsPerIp` limita los sockets previos al inicio no autenticados por IP de origen.
- `streaming.maxConnections` limita el total de sockets abiertos de flujo de medios (pendientes + activos).
- La reserva en tiempo de ejecución todavía acepta esas claves antiguas de voice-call por ahora, pero la ruta de reescritura es `openclaw doctor --fix` y la capa de compatibilidad es temporal.

## Conversaciones de voz en tiempo real

`realtime` selecciona un proveedor de voz en tiempo real full duplex para el audio de llamadas en vivo.
Está separado de `streaming`, que solo reenvía audio a proveedores de
transcripción en tiempo real.

Comportamiento actual en tiempo de ejecución:

- `realtime.enabled` es compatible con Twilio Media Streams.
- `realtime.enabled` no puede combinarse con `streaming.enabled`.
- `realtime.provider` es opcional. Si no se establece, Voice Call usa el primer
  proveedor de voz en tiempo real registrado.
- Los proveedores de voz en tiempo real incluidos son Google Gemini Live (`google`) y
  OpenAI (`openai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `realtime.providers.<providerId>`.
- Voice Call expone la herramienta compartida en tiempo real `openclaw_agent_consult` de forma
  predeterminada. El modelo en tiempo real puede llamarla cuando quien llama solicita un
  razonamiento más profundo, información actual o herramientas normales de OpenClaw.
- `realtime.toolPolicy` controla la ejecución de consult:
  - `safe-read-only`: expone la herramienta consult y limita el agente normal a
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
    `memory_get`.
  - `owner`: expone la herramienta consult y permite que el agente normal use la política
    normal de herramientas del agente.
  - `none`: no expone la herramienta consult. Las `realtime.tools` personalizadas
    siguen pasándose al proveedor en tiempo real.
- Las claves de sesión de consult reutilizan la sesión de voz existente cuando está disponible; luego
  recurren al número de teléfono de quien llama o del destinatario para que las llamadas de consult de seguimiento mantengan
  el contexto durante la llamada.
- Si `realtime.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de
  voz en tiempo real registrado, Voice Call registra una advertencia y omite los
  medios en tiempo real en lugar de hacer fallar todo el Plugin.

Valores predeterminados en tiempo real de Google Gemini Live:

- Clave de API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` o
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Ejemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Habla brevemente. Llama a openclaw_agent_consult antes de usar herramientas más avanzadas.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Usa OpenAI en su lugar:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Consulta [proveedor de Google](/es/providers/google) y [proveedor de OpenAI](/es/providers/openai)
para ver las opciones de voz en tiempo real específicas del proveedor.

## Transcripción de streaming

`streaming` selecciona un proveedor de transcripción en tiempo real para el audio de llamadas en vivo.

Comportamiento actual en tiempo de ejecución:

- `streaming.provider` es opcional. Si no se establece, Voice Call usa el primer
  proveedor de transcripción en tiempo real registrado.
- Los proveedores de transcripción en tiempo real incluidos son Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) y xAI
  (`xai`), registrados por sus Plugins de proveedor.
- La configuración sin procesar propiedad del proveedor vive en `streaming.providers.<providerId>`.
- Si `streaming.provider` apunta a un proveedor no registrado, o no hay ningún proveedor de
  transcripción en tiempo real registrado, Voice Call registra una advertencia y
  omite el streaming de medios en lugar de hacer fallar todo el Plugin.

Valores predeterminados de transcripción en streaming de OpenAI:

- Clave de API: `streaming.providers.openai.apiKey` o `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Valores predeterminados de transcripción en streaming de xAI:

- Clave de API: `streaming.providers.xai.apiKey` o `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Ejemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional si OPENAI_API_KEY está establecido
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Usa xAI en su lugar:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // opcional si XAI_API_KEY está establecido
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Las claves heredadas todavía se migran automáticamente mediante `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Recolector de llamadas obsoletas

Usa `staleCallReaperSeconds` para finalizar llamadas que nunca reciben un Webhook terminal
(por ejemplo, llamadas en modo notify que nunca se completan). El valor predeterminado es `0`
(deshabilitado).

Rangos recomendados:

- **Producción:** `120`–`300` segundos para flujos de estilo notify.
- Mantén este valor **por encima de `maxDurationSeconds`** para que las llamadas normales puedan
  finalizar. Un buen punto de partida es `maxDurationSeconds + 30–60` segundos.

Ejemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Seguridad de Webhook

Cuando un proxy o túnel se sitúa delante del Gateway, el Plugin reconstruye la
URL pública para la verificación de firma. Estas opciones controlan qué encabezados
reenviados son de confianza.

`webhookSecurity.allowedHosts` crea una lista permitida de hosts a partir de encabezados de reenvío.

`webhookSecurity.trustForwardingHeaders` confía en los encabezados reenviados sin una lista permitida.

`webhookSecurity.trustedProxyIPs` solo confía en los encabezados reenviados cuando la IP
remota de la solicitud coincide con la lista.

La protección contra repetición de Webhook está habilitada para Twilio y Plivo. Las solicitudes de Webhook
válidas repetidas se reconocen, pero se omiten en cuanto a efectos secundarios.

Los turnos de conversación de Twilio incluyen un token por turno en las devoluciones de llamada de `<Gather>`, por lo que
las devoluciones de llamada de voz obsoletas o repetidas no pueden satisfacer un turno de transcripción
pendiente más reciente.

Las solicitudes de Webhook no autenticadas se rechazan antes de leer el cuerpo cuando faltan los
encabezados de firma requeridos por el proveedor.

El Webhook de voice-call usa el perfil compartido de cuerpo previo a la autenticación (64 KB / 5 segundos)
más un límite por IP de solicitudes en vuelo antes de la verificación de firma.

Ejemplo con un host público estable:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS para llamadas

Voice Call usa la configuración principal `messages.tts` para
transmitir voz en llamadas. Puedes sobrescribirla en la configuración del Plugin con la
**misma forma** — se fusiona en profundidad con `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Notas:

- Las claves heredadas `tts.<provider>` dentro de la configuración del Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) se reparan con `openclaw doctor --fix`; la configuración confirmada debe usar `tts.providers.<provider>`.
- **La voz de Microsoft se ignora en las llamadas de voz** (el audio de telefonía necesita PCM; el transporte actual de Microsoft no expone salida PCM de telefonía).
- El TTS principal se usa cuando el streaming de medios de Twilio está habilitado; de lo contrario, las llamadas recurren a voces nativas del proveedor.
- Si ya hay un flujo de medios de Twilio activo, Voice Call no recurre a TwiML `<Say>`. Si el TTS de telefonía no está disponible en ese estado, la solicitud de reproducción falla en lugar de mezclar dos rutas de reproducción.
- Cuando el TTS de telefonía recurre a un proveedor secundario, Voice Call registra una advertencia con la cadena de proveedores (`from`, `to`, `attempts`) para depuración.
- Cuando la interrupción o el desmontaje del flujo de Twilio vacía la cola de TTS pendiente, las solicitudes
  de reproducción en cola se resuelven en lugar de dejar bloqueadas a las personas que llaman y que están esperando
  la finalización de la reproducción.

### Más ejemplos

Usar solo el TTS principal (sin sobrescritura):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Sobrescribir a ElevenLabs solo para llamadas (mantener el valor principal en otros lugares):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Sobrescribir solo el modelo de OpenAI para llamadas (ejemplo de fusión en profundidad):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Llamadas entrantes

La política de entrada tiene como valor predeterminado `disabled`. Para habilitar llamadas entrantes, establece:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "¡Hola! ¿Cómo puedo ayudarte?",
}
```

`inboundPolicy: "allowlist"` es un filtro de identificador de llamada de baja garantía. El Plugin
normaliza el valor `From` proporcionado por el proveedor y lo compara con `allowFrom`.
La verificación del Webhook autentica la entrega del proveedor y la integridad de la carga, pero
no demuestra la propiedad del número de quien llama en PSTN/VoIP. Trata `allowFrom` como
filtrado de identificador de llamada, no como una identidad fuerte de quien llama.

Las respuestas automáticas usan el sistema del agente. Ajústalo con:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de salida hablada

Para las respuestas automáticas, Voice Call añade un contrato estricto de salida hablada al prompt del sistema:

- `{"spoken":"..."}`

Luego, Voice Call extrae el texto de voz de forma defensiva:

- Ignora las cargas marcadas como contenido de razonamiento/error.
- Analiza JSON directo, JSON delimitado o claves `"spoken"` en línea.
- Recurre a texto sin formato y elimina los párrafos iniciales probables de planificación/metadatos.

Esto mantiene la reproducción hablada centrada en texto dirigido a quien llama y evita filtrar texto de planificación al audio.

### Comportamiento de inicio de conversación

Para llamadas salientes de `conversation`, el manejo del primer mensaje está vinculado al estado de reproducción en vivo:

- El vaciado de la cola por interrupción y la respuesta automática se suprimen solo mientras el saludo inicial se está reproduciendo activamente.
- Si la reproducción inicial falla, la llamada vuelve a `listening` y el mensaje inicial permanece en cola para reintento.
- La reproducción inicial para streaming de Twilio comienza al conectar el flujo sin retraso adicional.
- La interrupción aborta la reproducción activa y vacía las entradas de TTS de Twilio que están en cola pero aún no se reproducen.
  Las entradas vaciadas se resuelven como omitidas, para que la lógica de respuesta de seguimiento
  pueda continuar sin esperar audio que nunca se reproducirá.
- Las conversaciones de voz en tiempo real usan el propio turno de apertura del flujo en tiempo real. Voice Call no publica una actualización TwiML `<Say>` heredada para ese mensaje inicial, por lo que las sesiones salientes `<Connect><Stream>` permanecen conectadas.

### Gracia por desconexión de flujo de Twilio

Cuando se desconecta un flujo de medios de Twilio, Voice Call espera `2000ms` antes de finalizar automáticamente la llamada:

- Si el flujo se vuelve a conectar durante esa ventana, la finalización automática se cancela.
- Si no se vuelve a registrar ningún flujo tras el período de gracia, la llamada finaliza para evitar llamadas activas bloqueadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias para call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # resume la latencia de turnos a partir de los registros
openclaw voicecall expose --mode funnel
```

`latency` lee `calls.jsonl` desde la ruta de almacenamiento predeterminada de voice-call. Usa
`--file <path>` para apuntar a un registro distinto y `--last <n>` para limitar el análisis
a los últimos N registros (valor predeterminado: 200). La salida incluye p50/p90/p99 para la
latencia de turnos y los tiempos de espera de escucha.

## Herramienta del agente

Nombre de la herramienta: `voice_call`

Acciones:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repositorio incluye un documento de skill correspondiente en `skills/voice-call/SKILL.md`.

## RPC de Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionado

- [Texto a voz](/es/tools/tts)
- [Modo conversación](/es/nodes/talk)
- [Activación por voz](/es/nodes/voicewake)
