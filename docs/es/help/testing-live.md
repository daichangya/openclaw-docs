---
read_when:
    - Ejecutar smokes en vivo de matriz de modelos / backend de CLI / ACP / proveedor de medios
    - Depurar la resolución de credenciales de pruebas en vivo
    - Añadir una nueva prueba en vivo específica de proveedor
sidebarTitle: Live tests
summary: 'Pruebas en vivo (con acceso a la red): matriz de modelos, backends de CLI, ACP, proveedores de medios, credenciales'
title: 'Pruebas: suites en vivo'
x-i18n:
    generated_at: "2026-04-25T13:48:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

Para inicio rápido, ejecutores de QA, suites unitarias/de integración y flujos Docker, consulta
[Pruebas](/es/help/testing). Esta página cubre las suites de pruebas **en vivo** (con acceso a la red):
matriz de modelos, backends de CLI, ACP y pruebas en vivo de proveedores de medios, además del
manejo de credenciales.

## En vivo: comandos smoke de perfil local

Haz `source` de `~/.profile` antes de comprobaciones en vivo ad hoc para que las claves de proveedor y las rutas de herramientas locales
coincidan con tu shell:

```bash
source ~/.profile
```

Smoke segura de medios:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke segura de disponibilidad de llamada de voz:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` es una ejecución en seco salvo que también esté presente `--yes`. Usa `--yes` solo
cuando quieras intencionadamente realizar una llamada de notificación real. Para Twilio, Telnyx y
Plivo, una comprobación de disponibilidad correcta requiere una URL pública de Webhook; los respaldos
solo locales de loopback/privados se rechazan por diseño.

## En vivo: barrido de capacidades de nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos los comandos anunciados actualmente** por un nodo Android conectado y verificar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración manual/precondicionada (la suite no instala/ejecuta/vincula la app).
  - Validación comando por comando de `node.invoke` del gateway para el nodo Android seleccionado.
- Configuración previa obligatoria:
  - La app Android ya debe estar conectada y vinculada al gateway.
  - La app debe mantenerse en primer plano.
  - Los permisos/consentimientos de captura deben haberse concedido para las capacidades que esperas que funcionen.
- Sobrescrituras opcionales de destino:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración Android: [App Android](/es/platforms/android)

## En vivo: smoke de modelos (claves de perfil)

Las pruebas en vivo se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Smoke de gateway” nos dice si toda la canalización gateway+agente funciona para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: completado directo del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos detectados
  - Usar `getApiKeyForModel` para seleccionar los modelos para los que tienes credenciales
  - Ejecutar un pequeño completion por modelo (y regresiones dirigidas cuando haga falta)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` centrado en la smoke del gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la lista de permitidos moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la lista de permitidos moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (lista de permitidos separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
  - Los barridos exhaustivos usan `OPENCLAW_LIVE_TEST_TIMEOUT_MS` para el tiempo de espera de toda la prueba de modelo directo. Predeterminado: 60 minutos.
  - Los sondeos de modelo directo se ejecutan con paralelismo de 20 por defecto; establece `OPENCLAW_LIVE_MODEL_CONCURRENCY` para sobrescribirlo.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista de permitidos separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y respaldos de entorno
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **solo el almacén de perfiles**
- Por qué existe esto:
  - Separa “la API del proveedor está rota / la clave no es válida” de “la canalización del agente del gateway está rota”
  - Contiene regresiones pequeñas y aisladas (ejemplo: OpenAI Responses/Codex Responses reasoning replay + flujos de llamada a herramientas)

### Capa 2: smoke del Gateway + agente dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Levantar un gateway en proceso
  - Crear/aplicar parches a una sesión `agent:dev:*` (sobrescritura de modelo por ejecución)
  - Iterar modelos con claves y verificar:
    - respuesta “significativa” (sin herramientas)
    - que funcione una invocación real de herramienta (sondeo read)
    - sondeos opcionales adicionales de herramientas (sondeo exec+read)
    - que sigan funcionando las rutas de regresión de OpenAI (solo tool-call → seguimiento)
- Detalles del sondeo (para que puedas explicar fallos rápidamente):
  - sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y le pide al agente que lo `read` y devuelva el nonce.
  - sondeo `exec+read`: la prueba le pide al agente que escriba un nonce con `exec` en un archivo temporal y luego lo lea con `read`.
  - sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: lista de permitidos moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la lista de permitidos moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separada por comas) para reducirla
  - Los barridos modernos/all del gateway usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite más pequeño.
- Cómo seleccionar proveedores (evitar “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista de permitidos separada por comas)
- Los sondeos de herramientas e imagen siempre están activos en esta prueba en vivo:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG diminuto con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - El Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente incrustado reenvía un mensaje de usuario multimodal al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten pequeños errores)

Consejo: para ver qué puedes probar en tu máquina (y los IDs exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## En vivo: smoke de backend de CLI (Claude, Codex, Gemini u otras CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar la canalización Gateway + agente usando un backend de CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del plugin propietario del backend de CLI.
- Sobrescrituras (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt). Las recetas Docker lo desactivan por defecto salvo que se solicite explícitamente.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivo de imagen como argumentos de CLI en lugar de inyectarlas en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los argumentos de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` para activar la prueba de continuidad en la misma sesión Claude Sonnet -> Opus cuando el modelo seleccionado admita un destino de cambio. Las recetas Docker lo desactivan por defecto para mayor fiabilidad agregada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` para activar el sondeo MCP/bucle de herramienta. Las recetas Docker lo desactivan por defecto salvo que se solicite explícitamente.

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas Docker de proveedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor Docker vive en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta la smoke en vivo del backend de CLI dentro de la imagen Docker del repositorio como usuario `node` sin privilegios.
- Resuelve los metadatos de smoke de CLI desde la extensión propietaria y luego instala el paquete CLI de Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible en caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción de Claude Code mediante `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primero demuestra `claude -p` directo en Docker y luego ejecuta dos turnos del backend de CLI del Gateway sin conservar variables de entorno de clave API de Anthropic. Esta ruta de suscripción desactiva por defecto los sondeos MCP/herramienta e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación por uso adicional en lugar de los límites normales del plan de suscripción.
- La smoke en vivo del backend de CLI ahora ejerce el mismo flujo de extremo a extremo para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a la herramienta MCP `cron` verificada mediante la CLI del gateway.
- La smoke predeterminada de Claude también aplica un parche a la sesión de Sonnet a Opus y verifica que la sesión reanudada siga recordando una nota anterior.

## En vivo: smoke de vinculación ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de vinculación de conversación ACP con un agente ACP en vivo:
  - enviar `/acp spawn <agent> --bind here`
  - vincular una conversación sintética de canal de mensajes en el mismo lugar
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue al transcript de la sesión ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Sobrescrituras:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Notas:
  - Esta ruta usa la superficie `chat.send` del gateway con campos admin-only de ruta de origen sintética para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir una entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro de agentes integrado del Plugin `acpx` incrustado para el agente harness ACP seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Notas de Docker:

- El ejecutor Docker vive en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta la smoke de vinculación ACP contra los agentes CLI en vivo agregados en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` para reducir la matriz.
- Hace `source` de `~/.profile`, prepara el material de autenticación CLI correspondiente dentro del contenedor y luego instala la CLI en vivo solicitada (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` u `opencode-ai`) si falta. El propio backend ACP es el paquete `acpx/runtime` incrustado incluido del Plugin `acpx`.
- La variante Docker de OpenCode es una ruta estricta de regresión de agente único. Escribe un modelo predeterminado temporal de `OPENCODE_CONFIG_CONTENT` a partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predeterminado `opencode/kimi-k2.6`) después de hacer `source` de `~/.profile`, y `pnpm test:docker:live-acp-bind:opencode` requiere un transcript de asistente vinculado en lugar de aceptar la omisión genérica posterior a la vinculación.
- Las llamadas directas a la CLI `acpx` son solo una ruta manual/de solución alternativa para comparar comportamiento fuera del Gateway. La smoke ACP bind de Docker ejerce el backend de entorno de ejecución incrustado `acpx` de OpenClaw.

## En vivo: smoke del arnés app-server de Codex

- Objetivo: validar el arnés Codex propiedad del plugin mediante el método normal `agent` del gateway:
  - cargar el Plugin `codex` incluido
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente del gateway a `openai/gpt-5.2` con el arnés Codex forzado
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del app-server
    puede reanudarse
  - ejecutar `/codex status` y `/codex models` a través de la misma ruta de comando
    del gateway
  - opcionalmente ejecutar dos sondeos de shell escalados revisados por Guardian: uno benigno
    que debería aprobarse y una falsa carga de secreto que debería denegarse para que
    el agente vuelva a preguntar
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `openai/gpt-5.2`
- Sondeo opcional de imagen: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo opcional de MCP/herramienta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sondeo opcional de Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- La smoke establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés Codex roto
  no pueda pasar recurriendo silenciosamente al respaldo PI.
- Autenticación: autenticación del app-server de Codex desde el inicio de sesión local de suscripción de Codex.
  Las smokes Docker también pueden proporcionar `OPENAI_API_KEY` para sondeos no Codex cuando corresponda,
  además de `~/.codex/auth.json` y `~/.codex/config.toml` copiados opcionalmente.

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor Docker vive en `scripts/test-live-codex-harness-docker.sh`.
- Hace `source` del `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de autenticación de CLI de Codex cuando están presentes, instala `@openai/codex` en un
  prefijo npm montado y escribible, prepara el árbol de código fuente y luego ejecuta solo la prueba en vivo del arnés Codex.
- Docker habilita por defecto los sondeos de imagen, MCP/herramienta y Guardian. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` cuando necesites una ejecución de
  depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, igual que la
  configuración de prueba en vivo, para que los alias heredados o el respaldo PI no puedan ocultar una
  regresión del arnés Codex.

### Recetas en vivo recomendadas

Las listas de permitidos estrechas y explícitas son las más rápidas y menos inestables:

- Modelo único, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke de gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamada a herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de thinking adaptativo de Google:
  - Si las claves locales viven en el perfil del shell: `source ~/.profile`
  - Predeterminado dinámico de Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Presupuesto dinámico de Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el bridge OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini frente a CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google por HTTP (autenticación por clave API / perfil); esto es lo que la mayoría de usuarios quiere decir con “Gemini”.
  - CLI: OpenClaw ejecuta una binaria local `gemini`; tiene su propia autenticación y puede comportarse de forma distinta (streaming/compatibilidad de herramientas/desajuste de versión).

## En vivo: matriz de modelos (qué cubrimos)

No hay una “lista fija de modelos de CI” (las pruebas en vivo son optativas), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto moderno de smoke (llamada a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos que siga funcionando:

- OpenAI (no Codex): `openai/gpt-5.2`
- OAuth de OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita los modelos antiguos Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` y `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta smoke de gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: llamada a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedor:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (agradable de tener):

- xAI: `xai/grok-4` (o el último disponible)
- Mistral: `mistral/`… (elige un modelo “tools” que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; la llamada a herramientas depende del modo API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI con visión, etc.) para ejercer el sondeo de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz en vivo (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (cloud/API), más cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes fijar “todos los modelos” en la documentación. La lista autorizada es lo que `discoverModels(...)` devuelva en tu máquina + las claves que estén disponibles.

## Credenciales (nunca las confirmes en el repositorio)

Las pruebas en vivo detectan credenciales igual que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas en vivo deberían encontrar las mismas claves.
- Si una prueba en vivo dice “no creds”, depúrala igual que depurarías `openclaw models list` / selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significan “profile keys” en las pruebas en vivo)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia en el home de pruebas en vivo preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones locales en vivo copian por defecto la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación CLI externos compatibles en un home temporal de prueba; los homes en vivo preparados omiten `workspace/` y `sandboxes/`, y se eliminan las sobrescrituras de ruta `agents.*.workspace` / `agentDir` para que los sondeos no toquen tu espacio de trabajo real del host.

Si quieres depender de claves de entorno (por ejemplo exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## En vivo: Deepgram (transcripción de audio)

- Prueba: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## En vivo: plan de programación de BytePlus

- Prueba: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sobrescritura opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## En vivo: medios de flujo de trabajo ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejerce las rutas incluidas de imagen, vídeo y `music_generate` de comfy
  - Omite cada capacidad salvo que `plugins.entries.comfy.config.<capability>` esté configurado
  - Útil después de cambiar el envío de flujo de trabajo comfy, el sondeo, las descargas o el registro del plugin

## En vivo: generación de imágenes

- Prueba: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera todos los plugins de proveedor de generación de imágenes registrados
  - Carga las variables de entorno de proveedor faltantes desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta cada proveedor configurado a través del entorno de ejecución compartido de generación de imágenes:
    - `<provider>:generate`
    - `<provider>:edit` cuando el proveedor declara compatibilidad con edición
- Proveedores incluidos actuales cubiertos:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Reducción opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

Para la ruta de CLI incluida, añade una smoke de `infer` después de que pase la
prueba en vivo del proveedor/entorno de ejecución:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Esto cubre el análisis de argumentos de CLI, la resolución de configuración/agente predeterminado, la activación
del Plugin incluido, la reparación bajo demanda de dependencias de entorno de ejecución incluidas, el entorno de ejecución
compartido de generación de imágenes y la solicitud en vivo al proveedor.

## En vivo: generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejerce la ruta compartida del proveedor de generación de música incluido
  - Actualmente cubre Google y MiniMax
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta ambos modos declarados del entorno de ejecución cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual de la ruta compartida:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo en vivo separado de Comfy, no este barrido compartido
- Reducción opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

## En vivo: generación de vídeo

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejerce la ruta compartida del proveedor de generación de vídeo incluido
  - Usa por defecto la ruta smoke segura para la versión: proveedores no FAL, una solicitud text-to-video por proveedor, prompt de langosta de un segundo y un límite de operación por proveedor tomado de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` de forma predeterminada)
  - Omite FAL de forma predeterminada porque la latencia de cola del proveedor puede dominar el tiempo de la versión; pasa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para ejecutarlo explícitamente
  - Carga variables de entorno del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API en vivo/de entorno antes que los perfiles de autenticación almacenados, para que claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizable
  - Ejecuta solo `generate` de forma predeterminada
  - Establece `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para ejecutar también modos de transformación declarados cuando estén disponibles:
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de vídeo local respaldada por buffer en el barrido compartido
  - Proveedores actuales `imageToVideo` declarados pero omitidos en el barrido compartido:
    - `vydra` porque `veo3` incluido es solo texto y `kling` incluido requiere una URL remota de imagen
  - Cobertura específica de proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` text-to-video más una ruta `kling` que usa por defecto un fixture de URL remota de imagen
  - Cobertura actual en vivo de `videoToVideo`:
    - `runway` solo cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores actuales `videoToVideo` declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs remotas de referencia `http(s)` / MP4
    - `google` porque la ruta compartida actual Gemini/Veo usa entrada local respaldada por buffer y esa ruta no se acepta en el barrido compartido
    - `openai` porque la ruta compartida actual carece de garantías de acceso específico de organización a video inpaint/remix
- Reducción opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos los proveedores en el barrido predeterminado, incluido FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reducir el límite de operación de cada proveedor en una smoke agresiva
- Comportamiento opcional de autenticación:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar sobrescrituras solo de entorno

## Arnés en vivo de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites compartidas en vivo de imagen, música y vídeo a través de un único punto de entrada nativo del repositorio
  - Carga automáticamente las variables de entorno de proveedor faltantes desde `~/.profile`
  - Reduce automáticamente cada suite a proveedores que actualmente tienen autenticación utilizable de forma predeterminada
  - Reutiliza `scripts/test-live.mjs`, por lo que el comportamiento de Heartbeat y modo silencioso sigue siendo consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Relacionado

- [Pruebas](/es/help/testing) — suites unitarias, de integración, QA y Docker
