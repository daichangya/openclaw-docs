---
read_when:
    - Quieres un diagnóstico rápido del estado del canal + destinatarios recientes de la sesión
    - Quieres un estado “all” fácil de pegar para depuración
summary: Referencia de la CLI para `openclaw status` (diagnóstico, sondas, instantáneas de uso)
title: Estado
x-i18n:
    generated_at: "2026-04-25T13:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnóstico de canales + sesiones.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notas:

- `--deep` ejecuta sondas en vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` imprime ventanas de uso normalizadas como `X% left`.
- La salida del estado de sesión separa `Execution:` de `Runtime:`. `Execution` es la ruta del sandbox (`direct`, `docker/*`), mientras que `Runtime` indica si la sesión usa `OpenClaw Pi Default`, `OpenAI Codex`, un backend de CLI o un backend ACP como `codex (acp/acpx)`. Consulta [Runtimes de agentes](/es/concepts/agent-runtimes) para la distinción entre proveedor/modelo/runtime.
- Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan cuota restante, por lo que OpenClaw los invierte antes de mostrarlos; los campos basados en conteo tienen prioridad cuando están presentes. Las respuestas `model_remains` prefieren la entrada del modelo de chat, derivan la etiqueta de ventana a partir de marcas de tiempo cuando hace falta e incluyen el nombre del modelo en la etiqueta del plan.
- Cuando la instantánea de la sesión actual es escasa, `/status` puede rellenar contadores de tokens y caché a partir del registro de uso de la transcripción más reciente. Los valores activos no nulos existentes siguen teniendo prioridad sobre los de respaldo de la transcripción.
- El respaldo de transcripción también puede recuperar la etiqueta del modelo runtime activo cuando falta en la entrada de sesión en vivo. Si ese modelo de transcripción difiere del modelo seleccionado, status resuelve la ventana de contexto contra el modelo runtime recuperado en lugar del modelo seleccionado.
- Para el conteo del tamaño del prompt, el respaldo de transcripción prefiere el total orientado a prompt más grande cuando faltan metadatos de sesión o son menores, para que las sesiones de proveedor personalizado no colapsen a valores mostrados de `0` tokens.
- La salida incluye almacenes de sesión por agente cuando hay varios agentes configurados.
- La vista general incluye el estado de instalación/ejecución del servicio del host del Gateway + Node cuando está disponible.
- La vista general incluye el canal de actualización + SHA de git (para checkouts del código fuente).
- La información de actualización aparece en la vista general; si hay una actualización disponible, status muestra una sugerencia para ejecutar `openclaw update` (consulta [Actualización](/es/install/updating)).
- Las superficies de estado de solo lectura (`status`, `status --json`, `status --all`) resuelven los SecretRef compatibles para sus rutas de configuración de destino cuando es posible.
- Si un SecretRef de canal compatible está configurado pero no disponible en la ruta actual del comando, status permanece en solo lectura e informa una salida degradada en lugar de fallar. La salida para humanos muestra advertencias como “configured token unavailable in this command path”, y la salida JSON incluye `secretDiagnostics`.
- Cuando la resolución local de SecretRef del comando se completa correctamente, status prefiere la instantánea resuelta y elimina los marcadores transitorios de canal “secret unavailable” de la salida final.
- `status --all` incluye una fila de resumen de secretos y una sección de diagnóstico que resume el diagnóstico de secretos (truncado para facilitar la lectura) sin detener la generación del informe.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/gateway/doctor)
