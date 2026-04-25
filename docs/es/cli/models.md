---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres escanear los modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de la CLI para `openclaw models` (status/list/set/scan, alias, fallbacks, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-04-25T13:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descubrimiento, escaneo y configuración de modelos (modelo predeterminado, fallbacks, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando slash `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación de proveedores: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el valor resuelto de predeterminado/fallbacks junto con un resumen de autenticación.
Cuando hay instantáneas de uso del proveedor disponibles, la sección de estado OAuth/API key incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos del proveedor
cuando están disponibles; en caso contrario, OpenClaw recurre a credenciales OAuth/API key
coincidentes de perfiles de autenticación, variables de entorno o configuración.
En la salida `--json`, `auth.providers` es el resumen de proveedor con reconocimiento de
env/config/store, mientras que `auth.oauth` es solo el estado de salud de los perfiles del almacén de autenticación.
Agrega `--probe` para ejecutar sondas de autenticación en vivo contra cada perfil de proveedor configurado.
Las sondas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Si se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si está definido; en caso contrario, el
agente predeterminado configurado.
Las filas de sonda pueden venir de perfiles de autenticación, credenciales de entorno o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee la configuración, los perfiles de autenticación, el estado
  existente del catálogo y las filas del catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- `models list --all` incluye filas estáticas del catálogo propiedad del proveedor incluidas con OpenClaw incluso
  cuando todavía no te has autenticado con ese proveedor. Esas filas seguirán mostrando
  que no están disponibles hasta que se configure una autenticación coincidente.
- `models list` mantiene distintos los metadatos nativos del modelo y los límites de runtime. En la
  salida en tabla, `Ctx` muestra `contextTokens/contextWindow` cuando un límite efectivo de runtime
  difiere de la ventana de contexto nativa; las filas JSON incluyen `contextTokens`
  cuando un proveedor expone ese límite.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas visibles de selectores interactivos de proveedores,
  como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo por la **primera** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada primero como alias, luego
  como una coincidencia única entre proveedores configurados para ese id de modelo exacto, y solo después
  recurre al proveedor predeterminado configurado con una advertencia de obsolescencia.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un
  predeterminado obsoleto de un proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para placeholders no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### `models scan`

`models scan` lee el catálogo público `:free` de OpenRouter y clasifica candidatos para
uso como fallback. El catálogo en sí es público, por lo que los escaneos solo de metadatos no necesitan
una clave de OpenRouter.

Por defecto, OpenClaw intenta sondear la compatibilidad de herramientas e imágenes con llamadas live al modelo.
Si no hay una clave de OpenRouter configurada, el comando recurre a salida solo de metadatos y explica que
los modelos `:free` siguen requiriendo `OPENROUTER_API_KEY` para las sondas y la inferencia.

Opciones:

- `--no-probe` (solo metadatos; sin búsqueda de configuración/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (tiempo de espera para la solicitud del catálogo y para cada sonda)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` y `--set-image` requieren sondas live; los resultados de escaneo
solo de metadatos son informativos y no se aplican a la configuración.

### `models status`

Opciones:

- `--json`
- `--plain`
- `--check` (salida 1=faltante/caducado, 2=por caducar)
- `--probe` (sonda live de perfiles de autenticación configurados)
- `--probe-provider <name>` (sondear un proveedor)
- `--probe-profile <id>` (repetir o usar ids de perfil separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; sobrescribe `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorías de estado de las sondas:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos esperables en detalle/código de motivo de las sondas:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, por lo que la sonda informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente pero no es elegible/no puede resolverse.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver
  un candidato de modelo sondeable para ese proveedor.

## Alias + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` es el helper interactivo de autenticación. Puede iniciar un flujo de autenticación del proveedor
(OAuth/API key) o guiarte a un pegado manual de token, según el
proveedor que elijas.

`models auth login` ejecuta el flujo de autenticación de un plugin de proveedor (OAuth/API key). Usa
`openclaw plugins list` para ver qué proveedores están instalados.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos genéricos de token para proveedores
  que exponen métodos de autenticación por token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación por token del proveedor
  (usando por defecto el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` a menos que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` almacena un vencimiento absoluto del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw vuelve a estar permitido, así que OpenClaw trata la reutilización de Claude CLI y el uso de `claude -p` como autorizados para esta integración salvo que Anthropic publique una nueva política.
- `setup-token` / `paste-token` de Anthropic siguen disponibles como ruta de token compatible de OpenClaw, pero ahora OpenClaw prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)
