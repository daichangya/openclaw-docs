---
read_when:
    - Quieres entender OAuth en OpenClaw de extremo a extremo
    - Tuviste problemas de invalidación de tokens / cierre de sesión
    - Quieres flujos de autenticación de Claude CLI u OAuth
    - Quieres múltiples cuentas o enrutamiento por perfil
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones de múltiples cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-04-06T03:06:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 402e20dfeb6ae87a90cba5824a56a7ba3b964f3716508ea5cc48a47e5affdd73
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw admite “autenticación por suscripción” mediante OAuth para los
proveedores que la ofrecen (en particular **OpenAI Codex (ChatGPT OAuth)**).
Para Anthropic, la división práctica ahora es la siguiente:

- **Anthropic API key**: facturación normal de la API de Anthropic
- **Autenticación por suscripción de Anthropic dentro de OpenClaw**: Anthropic
  notificó a los usuarios de OpenClaw el **4 de abril de 2026 a las 12:00 p. m.
  PT / 8:00 p. m. BST** que esto ahora requiere **Extra Usage**

OpenAI Codex OAuth es compatible explícitamente para usarse en herramientas
externas como OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con API key es la ruta
recomendada y más segura.

- cómo funciona el **intercambio** de tokens OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo manejar **múltiples cuentas** (perfiles + anulaciones por sesión)

OpenClaw también admite **plugins de proveedor** que incluyen sus propios flujos
de OAuth o API key. Ejecútalos con:

```bash
openclaw models auth login --provider <id>
```

## El token sink (por qué existe)

Los proveedores OAuth suelen emitir un **nuevo refresh token** durante los
flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth)
pueden invalidar refresh tokens anteriores cuando se emite uno nuevo para la
misma combinación de usuario/aplicación.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos queda “desconectado” aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **token sink**:

- el entorno de ejecución lee credenciales desde **un solo lugar**
- podemos mantener varios perfiles y enrutar entre ellos de forma determinista
- cuando las credenciales se reutilizan desde una CLI externa como Codex CLI,
  OpenClaw las replica con procedencia y vuelve a leer esa fuente externa en vez
  de rotar él mismo el refresh token

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan **por agente**:

- Perfiles de autenticación (OAuth + API keys + refs opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se depuran cuando se detectan)

Archivo heredado solo para importación (todavía compatible, pero no es el
almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio
de estado). Referencia completa:
[/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para refs de secretos estáticos y el comportamiento de activación de snapshots en
tiempo de ejecución, consulta [Gestión de secretos](/es/gateway/secrets).

## Compatibilidad heredada de tokens de Anthropic

<Warning>
Los documentos públicos de Claude Code de Anthropic dicen que el uso directo de
Claude Code se mantiene dentro de los límites de suscripción de Claude. Por
separado, Anthropic informó a los usuarios de OpenClaw el **4 de abril de 2026
a las 12:00 p. m. PT / 8:00 p. m. BST** que **OpenClaw cuenta como un entorno
de terceros**. Los perfiles de token de Anthropic existentes siguen siendo
técnicamente utilizables en OpenClaw, pero Anthropic dice que la ruta de
OpenClaw ahora requiere **Extra Usage** (pago por uso facturado por separado de
la suscripción) para ese tráfico.

Para ver la documentación actual de Anthropic sobre planes para usar Claude Code
directamente, consulta [Using Claude Code with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax)
y [Z.AI / GLM Coding Plan](/es/providers/glm).
</Warning>

OpenClaw ahora vuelve a exponer el setup-token de Anthropic como una ruta
heredada/manual. El aviso de facturación específico de Anthropic para OpenClaw
sigue aplicándose a esa ruta, así que úsala con la expectativa de que
Anthropic requiere **Extra Usage** para el tráfico de inicio de sesión de Claude
impulsado por OpenClaw.

## Migración de Anthropic Claude CLI

Anthropic ya no tiene una ruta compatible de migración local de Claude CLI en
OpenClaw. Usa API keys de Anthropic para el tráfico de Anthropic, o conserva la
autenticación heredada basada en tokens solo donde ya esté configurada y con la
expectativa de que Anthropic trata esa ruta de OpenClaw como **Extra Usage**.

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos interactivos de inicio de sesión de OpenClaw se implementan en `@mariozechner/pi-ai` y se conectan en los asistentes/comandos.

### Setup-token de Anthropic

Forma del flujo:

1. iniciar setup-token de Anthropic o pegar token desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para control de reversión/orden

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth es compatible explícitamente para usarse fuera de Codex CLI,
incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar el callback en `http://127.0.0.1:1455/auth/callback`
4. si el callback no puede enlazarse (o estás en modo remoto/headless), pegar la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del access token y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación
`openai-codex`.

## Actualización + vencimiento

Los perfiles almacenan una marca de tiempo `expires`.

En tiempo de ejecución:

- si `expires` está en el futuro → usar el access token almacenado
- si venció → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- excepción: las credenciales reutilizadas de una CLI externa siguen administradas externamente; OpenClaw vuelve a leer el almacén de autenticación de la CLI y nunca consume por sí mismo el refresh token copiado

El flujo de actualización es automático; por lo general no necesitas administrar
los tokens manualmente.

## Múltiples cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si quieres que “personal” y “trabajo” nunca interactúen, usa agentes aislados
(sesiones + credenciales + espacio de trabajo separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Luego configura la autenticación por agente (asistente) y enruta los chats al
agente correcto.

### 2) Avanzado: múltiples perfiles en un agente

`auth-profiles.json` admite varios IDs de perfil para el mismo proveedor.

Elige qué perfil se usa:

- globalmente mediante el orden de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (anulación por sesión):

- `/model Opus@anthropic:work`

Cómo ver qué IDs de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentación relacionada:

- [/concepts/model-failover](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [/tools/slash-commands](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) — descripción general de autenticación de proveedores de modelos
- [Secrets](/es/gateway/secrets) — almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) — claves de configuración de autenticación
