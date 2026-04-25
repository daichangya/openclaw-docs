---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Sandbox por agente + restricciones de herramientas, precedencia y ejemplos»
title: Sandbox y herramientas multiagente
x-i18n:
    generated_at: "2026-04-25T13:58:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuración de sandbox y herramientas multiagente

Cada agente en una configuración multiagente puede sobrescribir la política global de sandbox y herramientas. Esta página cubre la configuración por agente, las reglas de precedencia y ejemplos.

- **Backends y modos de sandbox**: consulta [Sandboxing](/es/gateway/sandboxing).
- **Depuración de herramientas bloqueadas**: consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) y `openclaw sandbox explain`.
- **Exec elevado**: consulta [Elevated Mode](/es/tools/elevated).

La autenticación es por agente: cada agente lee desde su propio almacén de autenticación `agentDir` en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Las credenciales **no** se comparten entre agentes. Nunca reutilices `agentDir` entre agentes.
Si quieres compartir credenciales, copia `auth-profiles.json` al `agentDir` del otro agente.

---

## Ejemplos de configuración

### Ejemplo 1: agente personal + agente familiar restringido

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Resultado:**

- Agente `main`: se ejecuta en el host, con acceso completo a herramientas
- Agente `family`: se ejecuta en Docker (un contenedor por agente), solo con la herramienta `read`

---

### Ejemplo 2: agente de trabajo con sandbox compartido

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Ejemplo 2b: perfil global de coding + agente solo de mensajería

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Resultado:**

- los agentes predeterminados obtienen herramientas de coding
- el agente `support` es solo de mensajería (+ herramienta de Slack)

---

### Ejemplo 3: distintos modos de sandbox por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Predeterminado global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Sobrescritura: main nunca usa sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Sobrescritura: public siempre usa sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Precedencia de configuración

Cuando existen configuraciones globales (`agents.defaults.*`) y específicas por agente (`agents.list[].*`):

### Configuración de sandbox

La configuración específica por agente sobrescribe la global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Notas:**

- `agents.list[].sandbox.{docker,browser,prune}.*` sobrescribe `agents.defaults.sandbox.{docker,browser,prune}.*` para ese agente (se ignora cuando el alcance del sandbox se resuelve como `"shared"`).

### Restricciones de herramientas

El orden de filtrado es:

1. **Perfil de herramientas** (`tools.profile` o `agents.list[].tools.profile`)
2. **Perfil de herramientas por proveedor** (`tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de herramientas** (`tools.allow` / `tools.deny`)
4. **Política de herramientas por proveedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de herramientas específica por agente** (`agents.list[].tools.allow/deny`)
6. **Política de proveedor del agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de herramientas del sandbox** (`tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`)
8. **Política de herramientas del subagente** (`tools.subagents.tools`, si corresponde)

Cada nivel puede restringir aún más las herramientas, pero no puede volver a conceder herramientas denegadas en niveles anteriores.
Si se establece `agents.list[].tools.sandbox.tools`, reemplaza `tools.sandbox.tools` para ese agente.
Si se establece `agents.list[].tools.profile`, sobrescribe `tools.profile` para ese agente.
Las claves de herramientas por proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

Si alguna lista explícita de permitidos en esa cadena deja la ejecución sin herramientas invocables,
OpenClaw se detiene antes de enviar el prompt al modelo. Esto es intencional:
un agente configurado con una herramienta faltante como
`agents.list[].tools.allow: ["query_db"]` debe fallar de forma visible hasta que se habilite el plugin
que registra `query_db`, no continuar como un agente solo de texto.

Las políticas de herramientas admiten abreviaturas `group:*` que se expanden a varias herramientas. Consulta [Tool groups](/es/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver la lista completa.

Los overrides elevados por agente (`agents.list[].tools.elevated`) pueden restringir aún más `exec` elevado para agentes específicos. Consulta [Elevated Mode](/es/tools/elevated) para más detalles.

---

## Migración desde agente único

**Antes (agente único):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Después (multiagente con perfiles diferentes):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Las configuraciones heredadas `agent.*` son migradas por `openclaw doctor`; en adelante, prefiere `agents.defaults` + `agents.list`.

---

## Ejemplos de restricción de herramientas

### Agente de solo lectura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de ejecución segura (sin modificaciones de archivos)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente solo de comunicación

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` en este perfil sigue devolviendo una vista de recuperación acotada y saneada en lugar de un volcado bruto de transcripción. La recuperación del asistente elimina etiquetas de thinking,
el andamiaje de `<relevant-memories>`, payloads XML de llamadas a herramientas en texto plano
(incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
andamiaje degradado de llamadas a herramientas, tokens de control del modelo filtrados en ASCII/ancho completo
y XML malformado de llamadas a herramientas de MiniMax antes de la redacción/truncamiento.

---

## Error habitual: "non-main"

`agents.defaults.sandbox.mode: "non-main"` se basa en `session.mainKey` (predeterminado `"main"`),
no en el ID del agente. Las sesiones de grupo/canal siempre obtienen sus propias claves, por lo que
se consideran no principales y usarán sandbox. Si quieres que un agente nunca use
sandbox, establece `agents.list[].sandbox.mode: "off"`.

---

## Pruebas

Después de configurar sandbox y herramientas multiagente:

1. **Comprobar la resolución de agentes:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verificar contenedores de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Probar restricciones de herramientas:**
   - Envía un mensaje que requiera herramientas restringidas
   - Verifica que el agente no pueda usar herramientas denegadas

4. **Supervisar registros:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solución de problemas

### El agente no usa sandbox a pesar de `mode: "all"`

- Comprueba si hay un `agents.defaults.sandbox.mode` global que lo sobrescriba
- La configuración específica por agente tiene precedencia, así que establece `agents.list[].sandbox.mode: "all"`

### Las herramientas siguen disponibles a pesar de la lista de denegados

- Comprueba el orden de filtrado de herramientas: global → agente → sandbox → subagente
- Cada nivel solo puede restringir más, no volver a conceder
- Verifícalo con registros: `[tools] filtering tools for agent:${agentId}`

### El contenedor no está aislado por agente

- Establece `scope: "agent"` en la configuración específica de sandbox del agente
- El valor predeterminado es `"session"`, que crea un contenedor por sesión

---

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa del sandbox (modos, alcances, backends, imágenes)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de “¿por qué está bloqueado esto?”
- [Elevated Mode](/es/tools/elevated)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Gestión de sesiones](/es/concepts/session)
