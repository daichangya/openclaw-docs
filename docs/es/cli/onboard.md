---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-04-25T13:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Incorporación interactiva para la configuración local o remota del Gateway.

## Guías relacionadas

- Centro de incorporación de CLI: [Incorporación (CLI)](/es/start/wizard)
- Resumen de incorporación: [Resumen de incorporación](/es/start/onboarding-overview)
- Referencia de incorporación de CLI: [Referencia de configuración de CLI](/es/start/wizard-cli-reference)
- Automatización de CLI: [Automatización de CLI](/es/start/wizard-cli-automation)
- Incorporación en macOS: [Incorporación (aplicación de macOS)](/es/start/onboarding)

## Ejemplos

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` inicia la vista previa de incorporación conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo clásico de incorporación.

Para destinos `ws://` de red privada en texto sin cifrar (solo redes de confianza), configura
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.
No existe un equivalente en `openclaw.json` para este mecanismo de emergencia
del transporte del lado del cliente.

Proveedor personalizado no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` es opcional en modo no interactivo. Si se omite, la incorporación verifica `CUSTOM_API_KEY`.

LM Studio también admite una opción de clave específica del proveedor en modo no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` usa como valor predeterminado `http://127.0.0.1:11434`. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los ID de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena las claves del proveedor como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin formato.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como una referencia de entorno (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo `ref` no interactivo:

- Configura la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`).
- No pases opciones de clave en línea (por ejemplo, `--openai-api-key`) a menos que esa variable de entorno también esté configurada.
- Si se pasa una opción de clave en línea sin la variable de entorno requerida, la incorporación falla de inmediato con orientación.

Opciones de token del Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de Gateway administrados por SecretRef se validan, pero no se conservan como texto sin formato resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo token requiere un token y el SecretRef de token configurado no se puede resolver, la incorporación falla en modo cerrado con orientación de corrección.
- Con `--install-daemon`, si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está configurado, la incorporación bloquea la instalación hasta que el modo se configure explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si un archivo de configuración posterior no tiene `gateway.mode`, trátalo como daño de configuración o una edición manual incompleta, no como un atajo válido de modo local.
- `--allow-unconfigured` es un mecanismo de emergencia independiente del tiempo de ejecución del Gateway. No significa que la incorporación pueda omitir `gateway.mode`.

Ejemplo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Estado del Gateway local no interactivo:

- A menos que pases `--skip-health`, la incorporación espera a que un Gateway local accesible esté disponible antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación administrada del Gateway. Sin ella, ya debes tener un Gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- Si administras los archivos del espacio de trabajo por tu cuenta, pasa `--skip-bootstrap` para establecer `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero con Scheduled Tasks y recurre a un elemento de inicio de sesión por usuario en la carpeta de Inicio si se deniega la creación de la tarea.

Comportamiento de incorporación interactiva con modo de referencia:

- Elige **Use secret reference** cuando se te solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación previa rápida antes de guardar la referencia.
  - Si la validación falla, la incorporación muestra el error y te permite volver a intentarlo.

Opciones de endpoint de Z.AI no interactivas:

Nota: `--auth-choice zai-api-key` ahora detecta automáticamente el mejor endpoint de Z.AI para tu clave (prefiere la API general con `zai/glm-5.1`).
Si quieres específicamente los endpoints de GLM Coding Plan, elige `zai-coding-global` o `zai-coding-cn`.

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Ejemplo no interactivo de Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Notas del flujo:

- `quickstart`: solicitudes mínimas, genera automáticamente un token de Gateway.
- `manual`: solicitudes completas para puerto/vinculación/autenticación (alias de `advanced`).
- Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y lista permitida para ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`).
- Si el filtro de proveedor preferido no produce todavía modelos cargados, la incorporación recurre al catálogo sin filtrar en lugar de dejar el selector vacío.
- En el paso de búsqueda web, algunos proveedores pueden activar solicitudes de seguimiento específicas del proveedor:
  - **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y una elección de modelo `x_search`.
  - **Kimi** puede pedir la región de API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.
- Comportamiento del alcance de mensajes directos en la incorporación local: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Chat inicial más rápido: `openclaw dashboard` (Control UI, sin configuración de canales).
- Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados no listados. Usa Unknown para detección automática.

## Comandos de seguimiento habituales

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica el modo no interactivo. Usa `--non-interactive` para scripts.
</Note>
