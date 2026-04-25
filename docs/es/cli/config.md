---
read_when:
    - Quieres leer o editar la configuración de forma no interactiva
summary: Referencia de la CLI para `openclaw config` (get/set/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-04-25T13:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Utilidades de configuración para ediciones no interactivas en `openclaw.json`: get/set/unset/file/schema/validate
valores por ruta e imprimir el archivo de configuración activo. Ejecútalo sin subcomando para
abrir el asistente de configuración (igual que `openclaw configure`).

Opciones raíz:

- `--section <section>`: filtro repetible de secciones de configuración guiada cuando ejecutas `openclaw config` sin un subcomando

Secciones guiadas compatibles:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Ejemplos

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime el esquema JSON generado para `openclaw.json` en stdout como JSON.

Qué incluye:

- El esquema de configuración raíz actual, más un campo de cadena `$schema` en la raíz para herramientas del editor
- Metadatos de documentación de campos `title` y `description` usados por la UI de Control
- Los nodos de objetos anidados, comodines (`*`) y elementos de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existe documentación coincidente del campo
- Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación cuando existe documentación coincidente del campo
- Metadatos de esquema best-effort de Plugins + canales en vivo cuando se pueden cargar los manifiestos de runtime
- Un esquema de respaldo limpio incluso cuando la configuración actual no es válida

RPC de runtime relacionado:

- `config.schema.lookup` devuelve una ruta de configuración normalizada con un
  nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes),
  metadatos de sugerencias de UI coincidentes y resúmenes de hijos inmediatos. Úsalo para
  exploración detallada acotada por ruta en la UI de Control o clientes personalizados.

```bash
openclaw config schema
```

Redirígelo a un archivo cuando quieras inspeccionarlo o validarlo con otras herramientas:

```bash
openclaw config schema > openclaw.schema.json
```

### Rutas

Las rutas usan notación con puntos o corchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa el índice de la lista de agentes para dirigirte a un agente específico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Los valores se analizan como JSON5 cuando es posible; en caso contrario se tratan como cadenas.
Usa `--strict-json` para exigir el análisis como JSON5. `--json` sigue siendo compatible como alias heredado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para terminal.

La asignación de objetos reemplaza la ruta de destino de forma predeterminada. Las rutas protegidas de mapas/listas
que suelen contener entradas añadidas por el usuario, como `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` y
`auth.profiles`, rechazan reemplazos que eliminarían entradas existentes a menos
que pases `--replace`.

Usa `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo cuando realmente quieras que el valor proporcionado pase a ser
el valor completo del destino.

## Modos de `config set`

`openclaw config set` admite cuatro estilos de asignación:

1. Modo de valor: `openclaw config set <path> <value>`
2. Modo de generador de SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modo de generador de proveedor (solo ruta `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modo por lotes (`--batch-json` o `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Nota de política:

- Las asignaciones de SecretRef se rechazan en superficies mutables en runtime no compatibles (por ejemplo `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculación de hilos de Discord y JSON de credenciales de WhatsApp). Consulta [SecretRef Credential Surface](/es/reference/secretref-credential-surface).

El análisis por lotes siempre usa la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad.
`--strict-json` / `--json` no cambian el comportamiento del análisis por lotes.

El modo JSON de ruta/valor sigue siendo compatible tanto para SecretRefs como para proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicadores del generador de proveedor

Los destinos del generador de proveedor deben usar `secrets.providers.<alias>` como ruta.

Indicadores comunes:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Proveedor de entorno (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (repetible)

Proveedor de archivo (`--provider-source file`):

- `--provider-path <path>` (obligatorio)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Proveedor exec (`--provider-source exec`):

- `--provider-command <path>` (obligatorio)
- `--provider-arg <arg>` (repetible)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (repetible)
- `--provider-pass-env <ENV_VAR>` (repetible)
- `--provider-trusted-dir <path>` (repetible)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Ejemplo de proveedor exec reforzado:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Ejecución de prueba

Usa `--dry-run` para validar cambios sin escribir en `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Comportamiento de la ejecución de prueba:

- Modo generador: ejecuta comprobaciones de resolubilidad de SecretRef para refs/proveedores modificados.
- Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta validación de esquema más comprobaciones de resolubilidad de SecretRef.
- La validación de políticas también se ejecuta para superficies de destino de SecretRef no compatibles conocidas.
- Las comprobaciones de política evalúan toda la configuración posterior al cambio, por lo que las escrituras de objetos padre (por ejemplo establecer `hooks` como objeto) no pueden omitir la validación de superficies no compatibles.
- Las comprobaciones de SecretRef exec se omiten de forma predeterminada durante la ejecución de prueba para evitar efectos secundarios de comandos.
- Usa `--allow-exec` con `--dry-run` para habilitar las comprobaciones de SecretRef exec (esto puede ejecutar comandos del proveedor).
- `--allow-exec` es solo para ejecución de prueba y produce error si se usa sin `--dry-run`.

`--dry-run --json` imprime un informe legible por máquina:

- `ok`: si la ejecución de prueba pasó
- `operations`: número de asignaciones evaluadas
- `checks`: si se ejecutaron las comprobaciones de esquema/resolubilidad
- `checks.resolvabilityComplete`: si las comprobaciones de resolubilidad se ejecutaron hasta completarse (false cuando se omiten refs exec)
- `refsChecked`: número de refs realmente resueltos durante la ejecución de prueba
- `skippedExecRefs`: número de refs exec omitidos porque no se estableció `--allow-exec`
- `errors`: fallos estructurados de esquema/resolubilidad cuando `ok=false`

### Forma de la salida JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // presente para errores de resolubilidad
    },
  ],
}
```

Ejemplo de éxito:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Ejemplo de error:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: La variable de entorno \"MISSING_TEST_SECRET\" no está configurada.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Si la ejecución de prueba falla:

- `config schema validation failed`: la forma de tu configuración posterior al cambio no es válida; corrige la ruta/valor o la forma del objeto proveedor/ref.
- `Config policy validation failed: unsupported SecretRef usage`: devuelve esa credencial a una entrada de texto sin formato/cadena y mantén SecretRefs solo en superficies compatibles.
- `SecretRef assignment(s) could not be resolved`: el proveedor/ref referenciado actualmente no puede resolverse (falta una variable de entorno, puntero de archivo no válido, fallo del proveedor exec o incompatibilidad entre proveedor y source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: la ejecución de prueba omitió refs exec; vuelve a ejecutarla con `--allow-exec` si necesitas validar la resolubilidad exec.
- Para el modo por lotes, corrige las entradas fallidas y vuelve a ejecutar `--dry-run` antes de escribir.

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración administrados por OpenClaw validan toda la
configuración posterior al cambio antes de confirmarla en disco. Si la nueva carga útil falla la
validación del esquema o parece una sobrescritura destructiva, la configuración activa se deja intacta
y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.
La ruta de configuración activa debe ser un archivo normal. Los diseños de `openclaw.json`
con symlink no son compatibles para escritura; usa `OPENCLAW_CONFIG_PATH` para apuntar directamente
al archivo real.

Prefiere escrituras por CLI para ediciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si una escritura se rechaza, inspecciona la carga útil guardada y corrige la forma completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas con editor siguen estando permitidas, pero el Gateway en ejecución las trata como
no confiables hasta que validan. Las ediciones directas no válidas pueden restaurarse desde la
copia de seguridad de último estado válido durante el arranque o la recarga en caliente. Consulta
[Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config).

La recuperación de archivo completo se reserva para una configuración globalmente rota, como
errores de análisis, fallos de esquema a nivel raíz, fallos de migración heredada o fallos mixtos
de Plugins y raíz. Si la validación falla solo en `plugins.entries.<id>...`,
OpenClaw mantiene el `openclaw.json` activo en su lugar e informa del problema local del Plugin
en vez de restaurar `.last-good`. Esto evita que cambios en el esquema del Plugin o
desajustes de `minHostVersion` reviertan configuraciones de usuario no relacionadas como modelos,
proveedores, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o
configuración de Cron.

## Subcomandos

- `config file`: imprime la ruta del archivo de configuración activo (resuelta desde `OPENCLAW_CONFIG_PATH` o la ubicación predeterminada). La ruta debe nombrar un archivo normal, no un symlink.

Reinicia el Gateway después de las ediciones.

## Validar

Valida la configuración actual contra el esquema activo sin iniciar el
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Después de que `openclaw config validate` pase, puedes usar la TUI local para que
un agente integrado compare la configuración activa con la documentación mientras validas
cada cambio desde la misma terminal:

Si la validación ya está fallando, empieza con `openclaw configure` o
`openclaw doctor --fix`. `openclaw chat` no omite la protección contra
configuración no válida.

```bash
openclaw chat
```

Luego dentro de la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Bucle típico de reparación:

- Pide al agente que compare tu configuración actual con la página de documentación correspondiente y sugiera la corrección más pequeña.
- Aplica ediciones específicas con `openclaw config set` o `openclaw configure`.
- Vuelve a ejecutar `openclaw config validate` después de cada cambio.
- Si la validación pasa pero el runtime sigue sin estar en buen estado, ejecuta `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con migración y reparación.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)
