---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves API en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T03:10:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc6c4938674aedf20ff944bc04e742c9a7e77a5ff10ae4f95b5718504c57c2d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic desarrolla la familia de modelos **Claude** y proporciona acceso mediante una API.
En OpenClaw, la nueva configuración de Anthropic debe usar una clave API. Los perfiles heredados
existentes de tokens de Anthropic siguen respetándose en tiempo de ejecución si ya están
configurados.

<Warning>
Para Anthropic en OpenClaw, la división de facturación es:

- **Clave API de Anthropic**: facturación normal de la API de Anthropic.
- **Autenticación con suscripción de Claude dentro de OpenClaw**: Anthropic informó a los usuarios de OpenClaw el
  **4 de abril de 2026 a las 12:00 PM PT / 8:00 PM BST** que esto cuenta como
  uso de arnés de terceros y requiere **Extra Usage** (pago por uso,
  facturado por separado de la suscripción).

Nuestras reproducciones locales coinciden con esa división:

- `claude -p` directo aún puede funcionar
- `claude -p --append-system-prompt ...` puede activar la protección de Extra Usage cuando
  el prompt identifica a OpenClaw
- la misma instrucción del sistema similar a OpenClaw **no** reproduce el bloqueo en la
  ruta del SDK de Anthropic + `ANTHROPIC_API_KEY`

Así que la regla práctica es: **clave API de Anthropic, o suscripción de Claude con
Extra Usage**. Si quieres la ruta de producción más clara, usa una clave API de Anthropic.

Documentación pública actual de Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Si quieres la ruta de facturación más clara, usa en su lugar una clave API de Anthropic.
OpenClaw también admite otras opciones alojadas de estilo suscripción, incluidas [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding Plan](/es/providers/qwen),
[MiniMax Coding Plan](/es/providers/minimax) y [Z.AI / GLM Coding
Plan](/es/providers/glm).
</Warning>

## Opción A: clave API de Anthropic

**Ideal para:** acceso estándar a la API y facturación basada en uso.
Crea tu clave API en la consola de Anthropic.

### Configuración de CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Fragmento de configuración de Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Valores predeterminados de thinking (Claude 4.6)

- Los modelos Anthropic Claude 4.6 usan `adaptive` thinking de forma predeterminada en OpenClaw cuando no se establece un nivel de thinking explícito.
- Puedes anularlo por mensaje (`/think:<level>`) o en los parámetros del modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentación relacionada de Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo rápido (API de Anthropic)

El interruptor compartido `/fast` de OpenClaw también admite tráfico público directo de Anthropic, incluidas solicitudes autenticadas con clave API y OAuth enviadas a `api.anthropic.com`.

- `/fast on` se asigna a `service_tier: "auto"`
- `/fast off` se asigna a `service_tier: "standard_only"`
- Valor predeterminado de configuración:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Límites importantes:

- OpenClaw solo inyecta niveles de servicio de Anthropic para solicitudes directas a `api.anthropic.com`. Si enrutas `anthropic/*` a través de un proxy o gateway, `/fast` deja `service_tier` sin cambios.
- Los parámetros explícitos del modelo Anthropic `serviceTier` o `service_tier` anulan el valor predeterminado de `/fast` cuando ambos están establecidos.
- Anthropic informa el nivel efectivo en la respuesta bajo `usage.service_tier`. En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede seguir resolviéndose como `standard`.

## Caché de prompts (API de Anthropic)

OpenClaw admite la función de caché de prompts de Anthropic. Esto es **solo para API**; la autenticación heredada mediante token de Anthropic no respeta la configuración de caché.

### Configuración

Usa el parámetro `cacheRetention` en la configuración de tu modelo:

| Valor   | Duración de caché | Descripción                  |
| ------- | ----------------- | ---------------------------- |
| `none`  | Sin caché         | Desactiva la caché de prompts |
| `short` | 5 minutos         | Predeterminado para autenticación con clave API |
| `long`  | 1 hora            | Caché extendida              |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Valores predeterminados

Al usar autenticación con clave API de Anthropic, OpenClaw aplica automáticamente `cacheRetention: "short"` (caché de 5 minutos) para todos los modelos de Anthropic. Puedes anular esto estableciendo explícitamente `cacheRetention` en tu configuración.

### Anulaciones de `cacheRetention` por agente

Usa parámetros a nivel de modelo como base y luego anula agentes específicos mediante `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Orden de fusión de configuración para parámetros relacionados con la caché:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (coincide por `id`, anula por clave)

Esto permite que un agente mantenga una caché de larga duración mientras otro agente en el mismo modelo desactiva la caché para evitar costos de escritura en tráfico con ráfagas o de bajo reúso.

### Notas sobre Claude en Bedrock

- Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
- Los modelos de Bedrock que no son Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
- Los valores predeterminados inteligentes de la clave API de Anthropic también inicializan `cacheRetention: "short"` para referencias de modelo Claude-on-Bedrock cuando no se establece un valor explícito.

## Ventana de contexto de 1M (beta de Anthropic)

La ventana de contexto de 1M de Anthropic está protegida por beta. En OpenClaw, actívala por modelo
con `params.context1m: true` para modelos Opus/Sonnet compatibles.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw lo asigna a `anthropic-beta: context-1m-2025-08-07` en las solicitudes de Anthropic.

Esto solo se activa cuando `params.context1m` está establecido explícitamente en `true` para
ese modelo.

Requisito: Anthropic debe permitir el uso de contexto largo con esa credencial
(normalmente facturación con clave API, o la ruta de inicio de sesión de Claude de OpenClaw / autenticación heredada por token
con Extra Usage habilitado). De lo contrario, Anthropic devuelve:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Nota: actualmente Anthropic rechaza solicitudes beta `context-1m-*` cuando se usa
autenticación heredada por token de Anthropic (`sk-ant-oat-*`). Si configuras
`context1m: true` con ese modo de autenticación heredado, OpenClaw registra una advertencia y
vuelve a la ventana de contexto estándar omitiendo el encabezado beta context1m
mientras mantiene las betas OAuth requeridas.

## Eliminado: backend de Claude CLI

Se eliminó el backend `claude-cli` incluido de Anthropic.

- El aviso de Anthropic del 4 de abril de 2026 indica que el tráfico de inicio de sesión de Claude impulsado por OpenClaw es
  uso de arnés de terceros y requiere **Extra Usage**.
- Nuestras reproducciones locales también muestran que
  `claude -p --append-system-prompt ...` directo puede alcanzar la misma protección cuando el
  prompt añadido identifica a OpenClaw.
- La misma instrucción del sistema similar a OpenClaw no activa esa protección en la
  ruta del SDK de Anthropic + `ANTHROPIC_API_KEY`.
- Usa claves API de Anthropic para el tráfico de Anthropic en OpenClaw.

## Notas

- La documentación pública de Claude Code de Anthropic sigue documentando el uso directo del CLI, como
  `claude -p`, pero el aviso independiente de Anthropic a los usuarios de OpenClaw indica que la
  ruta de inicio de sesión de Claude de **OpenClaw** es uso de arnés de terceros y requiere
  **Extra Usage** (pago por uso facturado por separado de la suscripción).
  Nuestras reproducciones locales también muestran que
  `claude -p --append-system-prompt ...` directo puede alcanzar la misma protección cuando el
  prompt añadido identifica a OpenClaw, mientras que la misma forma de prompt no
  se reproduce en la ruta del SDK de Anthropic + `ANTHROPIC_API_KEY`. Para producción,
  recomendamos usar claves API de Anthropic en su lugar.
- El token de configuración de Anthropic vuelve a estar disponible en OpenClaw como ruta heredada/manual. El aviso de facturación específico de OpenClaw de Anthropic sigue aplicándose, así que úsalo con la expectativa de que Anthropic requiere **Extra Usage** para esta ruta.
- Los detalles de autenticación y las reglas de reutilización están en [/concepts/oauth](/es/concepts/oauth).

## Solución de problemas

**Errores 401 / token repentinamente inválido**

- La autenticación heredada por token de Anthropic puede caducar o revocarse.
- Para una configuración nueva, migra a una clave API de Anthropic.

**No API key found for provider "anthropic"**

- La autenticación es **por agente**. Los agentes nuevos no heredan las claves del agente principal.
- Vuelve a ejecutar la incorporación para ese agente, o configura una clave API en el host
  del gateway y luego verifica con `openclaw models status`.

**No credentials found for profile `anthropic:default`**

- Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo.
- Vuelve a ejecutar la incorporación, o configura una clave API para esa ruta de perfil.

**No available auth profile (all in cooldown/unavailable)**

- Comprueba `openclaw models status --json` para ver `auth.unusableProfiles`.
- Los enfriamientos por límite de tasa de Anthropic pueden tener alcance de modelo, por lo que un modelo Anthropic
  relacionado aún puede ser utilizable aunque el actual esté en enfriamiento.
- Añade otro perfil de Anthropic o espera a que termine el enfriamiento.

Más información: [/gateway/troubleshooting](/es/gateway/troubleshooting) y [/help/faq](/es/help/faq).
