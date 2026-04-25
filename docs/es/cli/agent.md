---
read_when:
    - Quieres ejecutar un turno de agente desde scripts (opcionalmente entregar la respuesta)
summary: Referencia de la CLI para `openclaw agent` (enviar un turno de agente a través del Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-25T13:42:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Ejecuta un turno de agente a través del Gateway (usa `--local` para modo integrado).
Usa `--agent <id>` para dirigirte directamente a un agente configurado.

Pasa al menos un selector de sesión:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Relacionado:

- Herramienta de envío de agentes: [Agent send](/es/tools/agent-send)

## Opciones

- `-m, --message <text>`: cuerpo del mensaje obligatorio
- `-t, --to <dest>`: destinatario usado para derivar la clave de sesión
- `--session-id <id>`: id de sesión explícito
- `--agent <id>`: id del agente; reemplaza las vinculaciones de enrutamiento
- `--thinking <level>`: nivel de razonamiento del agente (`off`, `minimal`, `low`, `medium`, `high`, además de niveles personalizados compatibles con el proveedor como `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: conserva el nivel detallado para la sesión
- `--channel <channel>`: canal de entrega; omítelo para usar el canal principal de la sesión
- `--reply-to <target>`: reemplazo del destino de entrega
- `--reply-channel <channel>`: reemplazo del canal de entrega
- `--reply-account <id>`: reemplazo de la cuenta de entrega
- `--local`: ejecuta directamente el agente integrado (después de la precarga del registro de plugins)
- `--deliver`: envía la respuesta de vuelta al canal/destino seleccionado
- `--timeout <seconds>`: reemplaza el tiempo de espera del agente (predeterminado 600 o el valor de configuración)
- `--json`: genera salida JSON

## Ejemplos

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notas

- El modo Gateway recurre al agente integrado cuando falla la solicitud al Gateway. Usa `--local` para forzar la ejecución integrada desde el principio.
- `--local` sigue precargando primero el registro de plugins, por lo que los proveedores, herramientas y canales proporcionados por plugins continúan disponibles durante las ejecuciones integradas.
- Cada invocación de `openclaw agent` se trata como una ejecución de un solo uso. Los servidores MCP incluidos o configurados por el usuario que se abran para esa ejecución se retiran después de la respuesta, incluso cuando el comando usa la ruta del Gateway, por lo que los procesos hijo MCP de stdio no permanecen activos entre invocaciones con scripts.
- `--channel`, `--reply-channel` y `--reply-account` afectan a la entrega de la respuesta, no al enrutamiento de la sesión.
- `--json` mantiene stdout reservado para la respuesta JSON. Los diagnósticos del Gateway, de plugins y del respaldo integrado se envían a stderr para que los scripts puedan analizar stdout directamente.
- Cuando este comando activa la regeneración de `models.json`, las credenciales del proveedor gestionadas por SecretRef se conservan como marcadores no secretos (por ejemplo, nombres de variables de entorno, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), no como texto sin formato de secretos resueltos.
- Las escrituras de marcadores son autoritativas desde el origen: OpenClaw conserva los marcadores desde la instantánea activa de la configuración de origen, no desde los valores secretos resueltos en tiempo de ejecución.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Runtime del agente](/es/concepts/agent)
