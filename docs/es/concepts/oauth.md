---
read_when:
    - Quieres entender OAuth de OpenClaw de extremo a extremo
    - Tienes problemas de invalidación de tokens o cierre de sesión
    - Quieres flujos de autenticación de Claude CLI o OAuth
    - Quieres varias cuentas o enrutamiento por perfil
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones de varias cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw admite “autenticación por suscripción” mediante OAuth para los proveedores que la ofrecen
(en particular, **OpenAI Codex (OAuth de ChatGPT)**). Para Anthropic, la separación práctica
ahora es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic
- **Autenticación por suscripción de Anthropic Claude CLI dentro de OpenClaw**: el personal de Anthropic
  nos indicó que este uso vuelve a estar permitido

OpenAI Codex OAuth es compatible explícitamente para su uso en herramientas externas como
OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con clave de API es la ruta recomendada más segura.

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + anulaciones por sesión)

OpenClaw también admite **plugins** de proveedor que incluyen sus propios flujos de OAuth o clave de API.
Ejecútalos mediante:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores OAuth suelen emitir un **nuevo token de actualización** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar tokens de actualización anteriores cuando se emite uno nuevo para el mismo usuario/aplicación.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos termina “cerrando sesión” aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el tiempo de ejecución lee las credenciales desde **un solo lugar**
- podemos mantener varios perfiles y enrutar entre ellos de forma determinista
- la reutilización de CLI externas depende del proveedor: Codex CLI puede inicializar un perfil vacío
  `openai-codex:default`, pero una vez que OpenClaw tiene un perfil local de OAuth,
  el token de actualización local es canónico; otras integraciones pueden seguir
  gestionadas externamente y releer su almacén de autenticación de CLI

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan **por agente**:

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se limpian al detectarse)

Archivo heredado solo para importación (aún compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa en `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para las referencias a secretos estáticos y el comportamiento de activación de instantáneas en tiempo de ejecución, consulta [Gestión de secretos](/es/gateway/secrets).

## Compatibilidad heredada con tokens de Anthropic

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code se mantiene dentro
de los límites de suscripción de Claude, y el personal de Anthropic nos indicó que el uso de Claude
CLI al estilo de OpenClaw vuelve a estar permitido. Por ello, OpenClaw trata la reutilización de Claude CLI y el uso de
`claude -p` como autorizados para esta integración, a menos que Anthropic
publique una nueva política.

Para la documentación actual de los planes directos de Claude Code de Anthropic, consulta [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/glm).
</Warning>

OpenClaw también expone el setup-token de Anthropic como una ruta compatible de autenticación por token, pero ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Migración de Anthropic Claude CLI

OpenClaw vuelve a admitir la reutilización de Anthropic Claude CLI. Si ya tienes un inicio de sesión local
de Claude en el host, la incorporación/configuración puede reutilizarlo directamente.

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos interactivos de inicio de sesión de OpenClaw se implementan en `@mariozechner/pi-ai` y se integran en los asistentes/comandos.

### Setup-token de Anthropic

Forma del flujo:

1. iniciar setup-token o paste-token de Anthropic desde OpenClaw
2. OpenClaw almacena la credencial resultante de Anthropic en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación existentes de Anthropic siguen disponibles para control de reversión/orden

### OpenAI Codex (OAuth de ChatGPT)

OpenAI Codex OAuth es compatible explícitamente para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si la devolución de llamada no puede enlazarse (o estás en remoto/sin interfaz), pegar la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del token de acceso y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai-codex`.

## Actualización + vencimiento

Los perfiles almacenan una marca temporal `expires`.

En tiempo de ejecución:

- si `expires` está en el futuro → usar el token de acceso almacenado
- si ha vencido → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- excepción: algunas credenciales de CLI externas siguen gestionadas externamente; OpenClaw
  relee esos almacenes de autenticación de CLI en lugar de consumir tokens de actualización copiados.
  La inicialización desde Codex CLI es intencionadamente más limitada: siembra un perfil vacío
  `openai-codex:default`, y luego las actualizaciones propiedad de OpenClaw mantienen el perfil local
  como canónico.

El flujo de actualización es automático; por lo general no necesitas gestionar tokens manualmente.

## Varias cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si quieres que “personal” y “trabajo” nunca interactúen, usa agentes aislados (sesiones + credenciales + espacio de trabajo separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Luego configura la autenticación por agente (asistente) y enruta los chats al agente correcto.

### 2) Avanzado: varios perfiles en un solo agente

`auth-profiles.json` admite varios ID de perfil para el mismo proveedor.

Elige qué perfil se usa:

- globalmente mediante el orden en la configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (anulación de sesión):

- `/model Opus@anthropic:work`

Cómo ver qué ID de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos con barra](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) — resumen de autenticación de proveedores de modelos
- [Secrets](/es/gateway/secrets) — almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) — claves de configuración de autenticación
