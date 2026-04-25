---
read_when:
    - Quieres ajustar credenciales, dispositivos o valores predeterminados del agente de forma interactiva
summary: Referencia de la CLI para `openclaw configure` (prompts de configuración interactiva)
title: Configurar
x-i18n:
    generated_at: "2026-04-25T13:43:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interactivo para configurar credenciales, dispositivos y valores predeterminados del agente.

Nota: La sección **Model** ahora incluye una selección múltiple para la lista de permitidos
`agents.defaults.models` (lo que aparece en `/model` y en el selector de modelos).
Las opciones de configuración con alcance de proveedor fusionan sus modelos seleccionados en la lista de permitidos
existente en lugar de reemplazar proveedores no relacionados ya presentes en la configuración.
Volver a ejecutar la autenticación del proveedor desde configure preserva un valor existente de
`agents.defaults.model.primary`; usa `openclaw models auth login --provider <id> --set-default`
o `openclaw models set <model>` cuando quieras cambiar intencionalmente el modelo predeterminado.

Cuando configure se inicia desde una opción de autenticación de proveedor, los selectores del modelo predeterminado y de la lista de permitidos prefieren automáticamente ese proveedor. Para proveedores emparejados como Volcengine/BytePlus, esa misma preferencia también coincide con sus variantes de plan de programación (`volcengine-plan/*`, `byteplus-plan/*`). Si el filtro de proveedor preferido produjera una lista vacía, configure vuelve al catálogo sin filtrar en lugar de mostrar un selector vacío.

Consejo: `openclaw config` sin subcomando abre el mismo asistente. Usa
`openclaw config get|set|unset` para ediciones no interactivas.

Para búsqueda web, `openclaw configure --section web` te permite elegir un proveedor
y configurar sus credenciales. Algunos proveedores también muestran prompts de seguimiento específicos del proveedor:

- **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y
  permitirte elegir un modelo `x_search`.
- **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a
  `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

Relacionado:

- Referencia de configuración del Gateway: [Configuración](/es/gateway/configuration)
- CLI de configuración: [Config](/es/cli/config)

## Opciones

- `--section <section>`: filtro de sección repetible

Secciones disponibles:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Notas:

- Elegir dónde se ejecuta el Gateway siempre actualiza `gateway.mode`. Puedes seleccionar "Continue" sin otras secciones si eso es todo lo que necesitas.
- Los servicios orientados a canales (Slack/Discord/Matrix/Microsoft Teams) solicitan listas de permitidos de canal/sala durante la configuración. Puedes introducir nombres o IDs; el asistente resuelve nombres a IDs cuando es posible.
- Si ejecutas el paso de instalación del daemon, la autenticación por token requiere un token, y `gateway.auth.token` está gestionado por SecretRef, configure valida el SecretRef pero no persiste los valores de token en texto sin formato resueltos en los metadatos del entorno del servicio supervisor.
- Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, configure bloquea la instalación del daemon con una guía de corrección accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, configure bloquea la instalación del daemon hasta que el modo se establezca explícitamente.

## Ejemplos

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
