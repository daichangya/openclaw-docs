---
read_when:
    - Estás eligiendo entre Pi, Codex, ACP u otro runtime de agente nativo
    - Estás confundido por las etiquetas de proveedor/modelo/runtime en el estado o la configuración
    - Estás documentando la paridad de compatibilidad para un harness nativo
summary: Cómo OpenClaw separa proveedores de modelos, modelos, canales y runtimes de agentes
title: Runtimes de agentes
x-i18n:
    generated_at: "2026-04-25T13:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Un **runtime de agente** es el componente que posee un bucle de modelo preparado: recibe el prompt, impulsa la salida del modelo, maneja las llamadas nativas a herramientas y devuelve el turno finalizado a OpenClaw.

Es fácil confundir los runtimes con los proveedores porque ambos aparecen cerca de la configuración del modelo. Son capas diferentes:

| Capa         | Ejemplos                              | Qué significa                                                       |
| ------------ | ------------------------------------- | ------------------------------------------------------------------- |
| Proveedor    | `openai`, `anthropic`, `openai-codex` | Cómo OpenClaw autentica, descubre modelos y nombra referencias de modelo. |
| Modelo       | `gpt-5.5`, `claude-opus-4-6`          | El modelo seleccionado para el turno del agente.                    |
| Runtime de agente | `pi`, `codex`, runtimes respaldados por ACP | El bucle de bajo nivel que ejecuta el turno preparado.              |
| Canal        | Telegram, Discord, Slack, WhatsApp    | Dónde entran y salen los mensajes de OpenClaw.                      |

También verás la palabra **harness** en el código y la configuración. Un harness es la
implementación que proporciona un runtime de agente. Por ejemplo, el harness Codex
incluido implementa el runtime `codex`. La clave de configuración sigue llamándose
`embeddedHarness` por compatibilidad, pero la documentación orientada al usuario y la salida de estado
generalmente deberían decir runtime.

La configuración común de Codex usa el proveedor `openai` con el runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Eso significa que OpenClaw selecciona una referencia de modelo de OpenAI y luego pide al
runtime app-server de Codex que ejecute el turno del agente embebido. No significa que el canal, el
catálogo del proveedor de modelos ni el almacén de sesiones de OpenClaw pasen a ser Codex.

Para la división de prefijos de la familia OpenAI, consulta [OpenAI](/es/providers/openai) y
[Proveedores de modelos](/es/concepts/model-providers). Para el contrato de compatibilidad del runtime Codex,
consulta [Codex harness](/es/plugins/codex-harness#v1-support-contract).

## Propiedad del runtime

Diferentes runtimes poseen distintas partes del bucle.

| Superficie                  | PI embebido de OpenClaw                | App-server de Codex                                                         |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Propietario del bucle de modelo | OpenClaw a través del runner PI embebido | App-server de Codex                                                         |
| Estado canónico del hilo    | Transcripción de OpenClaw              | Hilo de Codex, más espejo de la transcripción de OpenClaw                   |
| Herramientas dinámicas de OpenClaw | Bucle nativo de herramientas de OpenClaw | Conectadas mediante el adaptador de Codex                                   |
| Herramientas nativas de shell y archivos | Ruta PI/OpenClaw                       | Herramientas nativas de Codex, conectadas mediante hooks nativos cuando son compatibles |
| Motor de contexto           | Ensamblado nativo de contexto de OpenClaw | Contexto ensamblado por proyectos de OpenClaw dentro del turno de Codex     |
| Compaction                  | OpenClaw o el motor de contexto seleccionado | Compaction nativa de Codex, con notificaciones de OpenClaw y mantenimiento del espejo |
| Entrega del canal           | OpenClaw                               | OpenClaw                                                                    |

Esta división de propiedad es la regla principal de diseño:

- Si OpenClaw posee la superficie, OpenClaw puede proporcionar el comportamiento normal de hooks de plugins.
- Si el runtime nativo posee la superficie, OpenClaw necesita eventos del runtime o hooks nativos.
- Si el runtime nativo posee el estado canónico del hilo, OpenClaw debe reflejar y proyectar contexto, no reescribir elementos internos no compatibles.

## Selección de runtime

OpenClaw elige un runtime embebido después de resolver el proveedor y el modelo:

1. El runtime registrado de una sesión tiene prioridad. Los cambios de configuración no cambian en caliente una
   transcripción existente a un sistema de hilos nativo diferente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` fuerza ese runtime para sesiones nuevas o reiniciadas.
3. `agents.defaults.embeddedHarness.runtime` o
   `agents.list[].embeddedHarness.runtime` pueden establecer `auto`, `pi` o un
   id de runtime registrado como `codex`.
4. En modo `auto`, los runtimes de plugins registrados pueden reclamar pares proveedor/modelo compatibles.
5. Si ningún runtime reclama un turno en modo `auto` y está establecido
   `fallback: "pi"` (el valor predeterminado), OpenClaw usa PI como fallback de compatibilidad. Establece
   `fallback: "none"` para hacer que la selección no coincidente en modo `auto` falle en su lugar.

Los runtimes de plugins explícitos fallan de forma cerrada por defecto. Por ejemplo,
`runtime: "codex"` significa Codex o un error claro de selección, a menos que establezcas
`fallback: "pi"` en el mismo ámbito de sobrescritura. Una sobrescritura de runtime no hereda
una configuración de fallback más amplia, por lo que un `runtime: "codex"` a nivel de agente no se
redirige silenciosamente de vuelta a PI solo porque los valores predeterminados usaran `fallback: "pi"`.

## Contrato de compatibilidad

Cuando un runtime no es PI, debe documentar qué superficies de OpenClaw admite.
Usa esta forma para la documentación de runtimes:

| Pregunta                               | Por qué importa                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ¿Quién posee el bucle del modelo?      | Determina dónde ocurren los reintentos, la continuación de herramientas y las decisiones de respuesta final. |
| ¿Quién posee el historial canónico del hilo? | Determina si OpenClaw puede editar el historial o solo reflejarlo.                                  |
| ¿Funcionan las herramientas dinámicas de OpenClaw? | Los mensajes, las sesiones, Cron y las herramientas propiedad de OpenClaw dependen de esto.         |
| ¿Funcionan los hooks de herramientas dinámicas? | Los plugins esperan `before_tool_call`, `after_tool_call` y middleware alrededor de herramientas propiedad de OpenClaw. |
| ¿Funcionan los hooks de herramientas nativas? | Shell, patch y herramientas propiedad del runtime necesitan compatibilidad con hooks nativos para política y observación. |
| ¿Se ejecuta el ciclo de vida del motor de contexto? | Los plugins de memoria y contexto dependen del ensamblado, ingestión, after-turn y ciclo de vida de Compaction. |
| ¿Qué datos de Compaction se exponen?   | Algunos plugins solo necesitan notificaciones, mientras que otros necesitan metadatos de conservación/descartes. |
| ¿Qué no es compatible intencionalmente? | Los usuarios no deberían asumir equivalencia con PI cuando el runtime nativo posee más estado.      |

El contrato de compatibilidad del runtime Codex está documentado en
[Codex harness](/es/plugins/codex-harness#v1-support-contract).

## Etiquetas de estado

La salida de estado puede mostrar tanto las etiquetas `Execution` como `Runtime`. Léelas como
diagnóstico, no como nombres de proveedores.

- Una referencia de modelo como `openai/gpt-5.5` te indica el proveedor/modelo seleccionado.
- Un id de runtime como `codex` te indica qué bucle está ejecutando el turno.
- Una etiqueta de canal como Telegram o Discord te indica dónde está ocurriendo la conversación.

Si una sesión sigue mostrando PI después de cambiar la configuración del runtime, inicia una nueva sesión
con `/new` o limpia la actual con `/reset`. Las sesiones existentes conservan su
runtime registrado para que una transcripción no se reproduzca a través de dos sistemas de
sesión nativos incompatibles.

## Relacionado

- [Codex harness](/es/plugins/codex-harness)
- [OpenAI](/es/providers/openai)
- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Bucle del agente](/es/concepts/agent-loop)
- [Modelos](/es/concepts/models)
- [Estado](/es/cli/status)
