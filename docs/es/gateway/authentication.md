---
read_when:
    - Depurar autenticación de modelos o vencimiento de OAuth
    - Documentar autenticación o almacenamiento de credenciales
summary: 'Autenticación de modelos: OAuth, claves API y setup-token heredado de Anthropic'
title: Autenticación
x-i18n:
    generated_at: "2026-04-06T03:07:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f59ede3fcd7e692ad4132287782a850526acf35474b5bfcea29e0e23610636c2
    source_path: gateway/authentication.md
    workflow: 15
---

# Autenticación (proveedores de modelos)

<Note>
Esta página cubre la autenticación de **proveedores de modelos** (claves API, OAuth y setup-token heredado de Anthropic). Para la autenticación de la **conexión del gateway** (token, contraseña, trusted-proxy), consulta [Configuration](/es/gateway/configuration) y [Trusted Proxy Auth](/es/gateway/trusted-proxy-auth).
</Note>

OpenClaw admite OAuth y claves API para proveedores de modelos. Para hosts de
gateway siempre activos, las claves API suelen ser la opción más predecible. Los
flujos de suscripción/OAuth también se admiten cuando coinciden con el modelo de
cuenta de tu proveedor.

Consulta [/concepts/oauth](/es/concepts/oauth) para ver el flujo completo de OAuth y
la estructura de almacenamiento.
Para la autenticación basada en SecretRef (proveedores `env`/`file`/`exec`), consulta [Secrets Management](/es/gateway/secrets).
Para las reglas de elegibilidad de credenciales y códigos de motivo que usa `models status --probe`, consulta
[Auth Credential Semantics](/es/auth-credential-semantics).

## Configuración recomendada (clave API, cualquier proveedor)

Si ejecutas un gateway de larga duración, comienza con una clave API para el
proveedor elegido.
Para Anthropic en particular, la autenticación con clave API es la ruta segura. La
autenticación de estilo suscripción de Anthropic dentro de OpenClaw es la ruta heredada de setup-token y
debe tratarse como una ruta de **Extra Usage**, no como una ruta de límites del plan.

1. Crea una clave API en la consola de tu proveedor.
2. Colócala en el **host del gateway** (la máquina que ejecuta `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si el Gateway se ejecuta bajo systemd/launchd, es preferible colocar la clave en
   `~/.openclaw/.env` para que el daemon pueda leerla:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Después, reinicia el daemon (o reinicia tu proceso de Gateway) y vuelve a comprobar:

```bash
openclaw models status
openclaw doctor
```

Si prefieres no gestionar variables de entorno por tu cuenta, el onboarding puede almacenar
claves API para uso del daemon: `openclaw onboard`.

Consulta [Help](/es/help) para obtener detalles sobre la herencia de variables de entorno (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: compatibilidad con tokens heredados

La autenticación con setup-token de Anthropic sigue disponible en OpenClaw como una
ruta heredada/manual. La documentación pública de Claude Code de Anthropic todavía cubre el uso directo del terminal de
Claude Code con planes Claude, pero Anthropic informó por separado a los usuarios de
OpenClaw que la ruta de inicio de sesión de Claude de **OpenClaw** cuenta como uso de
herramienta de terceros y requiere **Extra Usage** facturado por separado de la
suscripción.

Para la ruta de configuración más clara, usa una clave API de Anthropic. Si debes mantener una
ruta de Anthropic de estilo suscripción en OpenClaw, usa la ruta heredada de setup-token
con la expectativa de que Anthropic la trate como **Extra Usage**.

Entrada manual de token (cualquier proveedor; escribe `auth-profiles.json` + actualiza la configuración):

```bash
openclaw models auth paste-token --provider openrouter
```

También se admiten referencias a perfiles de autenticación para credenciales estáticas:

- Las credenciales `api_key` pueden usar `keyRef: { source, provider, id }`
- Las credenciales `token` pueden usar `tokenRef: { source, provider, id }`
- Los perfiles en modo OAuth no admiten credenciales SecretRef; si `auth.profiles.<id>.mode` está configurado en `"oauth"`, se rechaza la entrada `keyRef`/`tokenRef` respaldada por SecretRef para ese perfil.

Comprobación apta para automatización (sale con `1` cuando faltan o vencieron, `2` cuando están por vencer):

```bash
openclaw models status --check
```

Sondeos de autenticación en vivo:

```bash
openclaw models status --probe
```

Notas:

- Las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.
- Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
  `excluded_by_auth_order` para ese perfil en lugar de intentarlo.
- Si existe autenticación pero OpenClaw no puede resolver un candidato de modelo sondeable para
  ese proveedor, el sondeo informa `status: no_model`.
- Los períodos de enfriamiento por límite de tasa pueden estar asociados a un modelo. Un perfil en enfriamiento para un
  modelo aún puede usarse para un modelo hermano en el mismo proveedor.

Los scripts operativos opcionales (systemd/Termux) están documentados aquí:
[Scripts de monitoreo de autenticación](/es/help/scripts#auth-monitoring-scripts)

## Nota sobre Anthropic

El backend `claude-cli` de Anthropic fue eliminado.

- Usa claves API de Anthropic para el tráfico de Anthropic en OpenClaw.
- El setup-token de Anthropic sigue siendo una ruta heredada/manual y debe usarse con
  la expectativa de facturación de Extra Usage que Anthropic comunicó a los usuarios de OpenClaw.
- `openclaw doctor` ahora detecta el estado obsoleto eliminado de Anthropic Claude CLI. Si
  todavía existen bytes de credenciales almacenados, doctor los convierte de vuelta en
  perfiles de token/OAuth de Anthropic. Si no, doctor elimina la configuración obsoleta de Claude CLI
  y te orienta hacia la recuperación con clave API o setup-token.

## Comprobar el estado de autenticación de modelos

```bash
openclaw models status
openclaw doctor
```

## Comportamiento de rotación de claves API (gateway)

Algunos proveedores admiten reintentar una solicitud con claves alternativas cuando una llamada API
alcanza un límite de tasa del proveedor.

- Orden de prioridad:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (anulación única)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Los proveedores de Google también incluyen `GOOGLE_API_KEY` como respaldo adicional.
- La misma lista de claves se deduplica antes de usarse.
- OpenClaw reintenta con la siguiente clave solo para errores de límite de tasa (por ejemplo,
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, o
  `workers_ai ... quota limit exceeded`).
- Los errores que no son de límite de tasa no se reintentan con claves alternativas.
- Si todas las claves fallan, se devuelve el error final del último intento.

## Controlar qué credencial se usa

### Por sesión (comando de chat)

Usa `/model <alias-or-id>@<profileId>` para fijar una credencial específica del proveedor para la sesión actual (ejemplos de ids de perfil: `anthropic:default`, `anthropic:work`).

Usa `/model` (o `/model list`) para un selector compacto; usa `/model status` para la vista completa (candidatos + siguiente perfil de autenticación, además de detalles del endpoint del proveedor cuando estén configurados).

### Por agente (anulación de CLI)

Configura una anulación explícita del orden de perfiles de autenticación para un agente (almacenada en el `auth-profiles.json` de ese agente):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Usa `--agent <id>` para apuntar a un agente específico; omítelo para usar el agente predeterminado configurado.
Cuando depures problemas de orden, `openclaw models status --probe` muestra los
perfiles almacenados omitidos como `excluded_by_auth_order` en lugar de omitirlos silenciosamente.
Cuando depures problemas de enfriamiento, recuerda que los períodos de enfriamiento por límite de tasa pueden estar ligados
a un id de modelo en lugar de a todo el perfil del proveedor.

## Solución de problemas

### "No credentials found"

Si falta el perfil de Anthropic, configura una clave API de Anthropic en el
**host del gateway** o configura la ruta heredada de setup-token de Anthropic, y luego vuelve a comprobar:

```bash
openclaw models status
```

### Token por vencer/vencido

Ejecuta `openclaw models status` para confirmar qué perfil está por vencer. Si falta un
perfil de token heredado de Anthropic o está vencido, actualiza esa configuración mediante
setup-token o migra a una clave API de Anthropic.

Si la máquina todavía tiene el estado obsoleto eliminado de Anthropic Claude CLI de compilaciones
anteriores, ejecuta:

```bash
openclaw doctor --yes
```

Doctor convierte `anthropic:claude-cli` de vuelta a token/OAuth de Anthropic cuando los
bytes de credenciales almacenados todavía existen. De lo contrario, elimina las referencias obsoletas
a perfil/configuración/modelo de Claude CLI y deja la guía de pasos siguientes.
