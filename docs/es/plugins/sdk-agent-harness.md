---
read_when:
    - Estás cambiando el runtime del agente integrado o el registro de arneses
    - Estás registrando un arnés de agente desde un Plugin incluido o de confianza
    - Necesitas entender cómo se relaciona el Plugin Codex con los proveedores de modelos
sidebarTitle: Agent Harness
summary: Superficie experimental del SDK para Plugins que reemplazan el ejecutor integrado de bajo nivel del agente
title: Plugins de arnés de agente
x-i18n:
    generated_at: "2026-04-25T13:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **arnés de agente** es el ejecutor de bajo nivel para un turno preparado de agente de OpenClaw.
No es un proveedor de modelos, ni un canal, ni un registro de herramientas.
Para el modelo mental orientado al usuario, consulta [Runtimes de agente](/es/concepts/agent-runtimes).

Usa esta superficie solo para Plugins nativos incluidos o de confianza. El contrato
sigue siendo experimental porque los tipos de parámetros reflejan intencionadamente el
runner integrado actual.

## Cuándo usar un arnés

Registra un arnés de agente cuando una familia de modelos tenga su propio runtime
de sesión nativo y el transporte normal de proveedor de OpenClaw sea una abstracción incorrecta.

Ejemplos:

- un servidor nativo de agente de codificación que controla hilos y Compaction
- una CLI o daemon local que debe transmitir eventos nativos de plan/razonamiento/herramientas
- un runtime de modelo que necesita su propio id de reanudación además de la
  transcripción de sesión de OpenClaw

**No** registres un arnés solo para añadir una nueva API de LLM. Para APIs de modelo
HTTP o WebSocket normales, crea un [Plugin de proveedor](/es/plugins/sdk-provider-plugins).

## Lo que sigue controlando el núcleo

Antes de seleccionar un arnés, OpenClaw ya ha resuelto:

- proveedor y modelo
- estado de autenticación del runtime
- nivel de razonamiento y presupuesto de contexto
- la transcripción/archivo de sesión de OpenClaw
- espacio de trabajo, sandbox y política de herramientas
- callbacks de respuesta de canal y callbacks de streaming
- política de fallback de modelo y cambio de modelo en vivo

Esa división es intencionada. Un arnés ejecuta un intento preparado; no elige
proveedores, no reemplaza la entrega del canal ni cambia modelos silenciosamente.

## Registrar un arnés

**Importación:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de selección

OpenClaw elige un arnés después de resolver proveedor/modelo:

1. Gana el id de arnés registrado en una sesión existente, de modo que los cambios de config/env no
   cambian en caliente esa transcripción a otro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza un arnés registrado con ese id para
   sesiones que aún no estén fijadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` fuerza el arnés PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pregunta a los arneses registrados si admiten el
   proveedor/modelo resuelto.
5. Si no coincide ningún arnés registrado, OpenClaw usa PI salvo que el fallback de PI
   esté desactivado.

Los fallos de arneses de Plugin se muestran como fallos de ejecución. En modo `auto`, el fallback a PI
solo se usa cuando ningún arnés de Plugin registrado admite el
proveedor/modelo resuelto. Una vez que un arnés de Plugin ha reclamado una ejecución, OpenClaw no
repite ese mismo turno a través de PI porque eso puede cambiar la semántica de autenticación/runtime
o duplicar efectos secundarios.

El id del arnés seleccionado se conserva con el id de sesión después de una ejecución integrada.
Las sesiones heredadas creadas antes de que existieran fijaciones de arnés se tratan como fijadas a PI una vez
que tienen historial de transcripción. Usa una sesión nueva/restablecida al cambiar entre PI y un
arnés nativo de Plugin. `/status` muestra ids de arnés no predeterminados como `codex`
junto a `Fast`; PI permanece oculto porque es la ruta de compatibilidad predeterminada.
Si el arnés seleccionado resulta sorprendente, habilita el registro de depuración `agents/harness` e
inspecciona el registro estructurado del gateway `agent harness selected`. Incluye
el id del arnés seleccionado, el motivo de selección, la política de runtime/fallback y, en
modo `auto`, el resultado de soporte de cada candidato de Plugin.

El Plugin Codex incluido registra `codex` como id de arnés. El núcleo lo trata
como un id ordinario de arnés de Plugin; los aliases específicos de Codex pertenecen al Plugin
o a la configuración del operador, no al selector de runtime compartido.

## Emparejamiento de proveedor y arnés

La mayoría de los arneses también deberían registrar un proveedor. El proveedor hace visibles
las referencias de modelos, el estado de autenticación, los metadatos del modelo y la selección de `/model`
al resto de OpenClaw. El arnés luego reclama ese proveedor en `supports(...)`.

El Plugin Codex incluido sigue este patrón:

- referencias de modelo preferidas por el usuario: `openai/gpt-5.5` más
  `embeddedHarness.runtime: "codex"`
- referencias de compatibilidad: las referencias heredadas `codex/gpt-*` siguen siendo aceptadas, pero las
  configuraciones nuevas no deberían usarlas como referencias normales de proveedor/modelo
- id de arnés: `codex`
- autenticación: disponibilidad sintética del proveedor, porque el arnés Codex controla el
  inicio de sesión/sesión nativos de Codex
- solicitud al app-server: OpenClaw envía el id de modelo sin adornos a Codex y deja que el
  arnés hable con el protocolo nativo del app-server

El Plugin Codex es aditivo. Las referencias simples `openai/gpt-*` siguen usando la
ruta normal de proveedor de OpenClaw, a menos que fuerces el arnés Codex con
`embeddedHarness.runtime: "codex"`. Las referencias antiguas `codex/gpt-*` siguen seleccionando el
proveedor y arnés Codex por compatibilidad.

Para la configuración del operador, ejemplos de prefijos de modelo y configuraciones solo de Codex, consulta
[Arnés Codex](/es/plugins/codex-harness).

OpenClaw requiere Codex app-server `0.118.0` o posterior. El Plugin Codex comprueba
el handshake de inicialización del app-server y bloquea servidores más antiguos o sin versión para que
OpenClaw solo se ejecute sobre la superficie de protocolo con la que se ha probado.

### Middleware de resultado de herramientas

Los Plugins incluidos pueden adjuntar middleware de resultado de herramientas neutral al runtime mediante
`api.registerAgentToolResultMiddleware(...)` cuando su manifiesto declara los
ids de runtime objetivo en `contracts.agentToolResultMiddleware`. Este punto de integración
de confianza es para transformaciones asíncronas de resultados de herramientas que deben ejecutarse antes de que PI o Codex devuelvan
la salida de la herramienta al modelo.

Los Plugins incluidos heredados aún pueden usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware solo del
app-server Codex, pero las nuevas transformaciones de resultados deberían usar la API neutral al runtime.
El hook `api.registerEmbeddedExtensionFactory(...)` solo de Pi ha sido eliminado;
las transformaciones de resultados de herramientas solo de Pi deben usar middleware neutral al runtime.

### Modo de arnés Codex nativo

El arnés `codex` incluido es el modo Codex nativo para turnos integrados de
agente de OpenClaw. Habilita primero el Plugin `codex` incluido e incluye `codex` en
`plugins.allow` si tu configuración usa una lista de permitidos restrictiva. Las configuraciones nativas de app-server
deben usar `openai/gpt-*` con `embeddedHarness.runtime: "codex"`.
Usa `openai-codex/*` para OAuth de Codex a través de PI. Las referencias heredadas de modelo `codex/*`
siguen siendo aliases de compatibilidad para el arnés nativo.

Cuando este modo se ejecuta, Codex controla el id de hilo nativo, el comportamiento de reanudación,
la Compaction y la ejecución del app-server. OpenClaw sigue controlando el canal de chat,
el espejo visible de la transcripción, la política de herramientas, las aprobaciones, la entrega de multimedia y la
selección de sesión. Usa `embeddedHarness.runtime: "codex"` sin un reemplazo de `fallback`
cuando necesites demostrar que solo la ruta del app-server Codex puede reclamar la ejecución.
Los runtimes explícitos de Plugin ya fallan de forma cerrada por defecto. Establece `fallback: "pi"`
solo cuando realmente quieras que PI maneje la falta de selección de arnés. Los fallos del
app-server Codex ya fallan directamente en lugar de reintentarse mediante PI.

## Desactivar fallback a PI

De forma predeterminada, OpenClaw ejecuta agentes integrados con `agents.defaults.embeddedHarness`
establecido en `{ runtime: "auto", fallback: "pi" }`. En modo `auto`, los arneses de Plugin registrados
pueden reclamar un par proveedor/modelo. Si ninguno coincide, OpenClaw recurre a PI.

En modo `auto`, establece `fallback: "none"` cuando necesites que la falta de selección
del arnés de Plugin falle en lugar de usar PI. Los runtimes explícitos de Plugin como
`runtime: "codex"` ya fallan de forma cerrada por defecto, a menos que se establezca `fallback: "pi"`
en la misma configuración o ámbito de reemplazo por entorno. Los fallos del arnés de Plugin seleccionado
siempre fallan de forma definitiva. Esto no bloquea un `runtime: "pi"` explícito ni
`OPENCLAW_AGENT_RUNTIME=pi`.

Para ejecuciones integradas solo de Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Si quieres que cualquier arnés de Plugin registrado reclame modelos coincidentes pero nunca
quieres que OpenClaw recurra silenciosamente a PI, mantén `runtime: "auto"` y desactiva
el fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Los reemplazos por agente usan la misma forma:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` sigue reemplazando el runtime configurado. Usa
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desactivar el fallback a PI desde el
entorno.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Con el fallback desactivado, una sesión falla pronto cuando el arnés solicitado no está
registrado, no admite el proveedor/modelo resuelto o falla antes de
producir efectos secundarios del turno. Eso es intencionado para despliegues solo de Codex y
para pruebas en vivo que deben demostrar que realmente se está usando la ruta del app-server Codex.

Este ajuste solo controla el arnés de agente integrado. No desactiva
el enrutamiento específico por proveedor de imagen, vídeo, música, TTS, PDF u otros modelos.

## Sesiones nativas y espejo de transcripción

Un arnés puede mantener un id de sesión nativo, id de hilo o token de reanudación del lado del daemon.
Mantén esa vinculación explícitamente asociada con la sesión de OpenClaw y sigue
reflejando la salida visible para el usuario del asistente/herramienta en la transcripción de OpenClaw.

La transcripción de OpenClaw sigue siendo la capa de compatibilidad para:

- historial de sesión visible en el canal
- búsqueda e indexación de transcripciones
- volver al arnés PI integrado en un turno posterior
- comportamiento genérico de `/new`, `/reset` y eliminación de sesión

Si tu arnés almacena una vinculación lateral, implementa `reset(...)` para que OpenClaw pueda
borrarla cuando se restablezca la sesión propietaria de OpenClaw.

## Resultados de herramientas y multimedia

El núcleo construye la lista de herramientas de OpenClaw y la pasa al intento preparado.
Cuando un arnés ejecuta una llamada dinámica a herramienta, devuelve el resultado de la herramienta
a través de la forma de resultado del arnés en lugar de enviar tú mismo la multimedia del canal.

Esto mantiene el texto, imagen, vídeo, música, TTS, aprobaciones y salidas de herramientas de mensajería
en la misma ruta de entrega que las ejecuciones respaldadas por PI.

## Limitaciones actuales

- La ruta pública de importación es genérica, pero algunos aliases de tipos de intento/resultado aún
  llevan nombres `Pi` por compatibilidad.
- La instalación de arneses de terceros es experimental. Prefiere Plugins de proveedor
  hasta que necesites un runtime de sesión nativo.
- El cambio de arnés es compatible entre turnos. No cambies de arnés en mitad de un turno
  después de que hayan empezado herramientas nativas, aprobaciones, texto del asistente o envíos
  de mensajes.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview)
- [Auxiliares de runtime](/es/plugins/sdk-runtime)
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins)
- [Arnés Codex](/es/plugins/codex-harness)
- [Proveedores de modelos](/es/concepts/model-providers)
