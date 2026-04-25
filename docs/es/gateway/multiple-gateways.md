---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesitas configuración/estado/puertos aislados por Gateway
summary: Ejecutar varios Gateways de OpenClaw en un mismo host (aislamiento, puertos y perfiles)
title: Varios Gateways
x-i18n:
    generated_at: "2026-04-25T13:47:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

La mayoría de las configuraciones deberían usar un solo Gateway, porque un único Gateway puede gestionar múltiples conexiones de mensajería y agentes. Si necesitas un aislamiento más fuerte o redundancia (por ejemplo, un bot de rescate), ejecuta Gateways separados con perfiles/puertos aislados.

## Configuración recomendada

Para la mayoría de los usuarios, la configuración más simple para un bot de rescate es:

- mantener el bot principal en el perfil predeterminado
- ejecutar el bot de rescate con `--profile rescue`
- usar un bot de Telegram completamente independiente para la cuenta de rescate
- mantener el bot de rescate en un puerto base diferente, como `19789`

Esto mantiene el bot de rescate aislado del bot principal, para que pueda depurar o aplicar cambios de configuración si el bot principal deja de funcionar. Deja al menos 20 puertos entre los puertos base para que los puertos derivados de browser/canvas/CDP nunca entren en conflicto.

## Inicio rápido del bot de rescate

Úsalo como ruta predeterminada, a menos que tengas una razón sólida para hacer otra cosa:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si tu bot principal ya está en ejecución, normalmente eso es todo lo que necesitas.

Durante `openclaw --profile rescue onboard`:

- usa el token independiente del bot de Telegram
- mantén el perfil `rescue`
- usa un puerto base al menos 20 mayor que el del bot principal
- acepta el espacio de trabajo de rescate predeterminado, a menos que ya administres uno tú mismo

Si onboarding ya instaló el servicio de rescate por ti, el `gateway install` final no es necesario.

## Por qué funciona

El bot de rescate se mantiene independiente porque tiene su propio:

- perfil/configuración
- directorio de estado
- espacio de trabajo
- puerto base (más puertos derivados)
- token del bot de Telegram

Para la mayoría de las configuraciones, usa un bot de Telegram completamente separado para el perfil de rescate:

- fácil de mantener solo para operadores
- token e identidad del bot separados
- independiente de la instalación del canal/app del bot principal
- ruta de recuperación simple basada en mensajes directos cuando el bot principal está roto

## Qué cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa el flujo normal de onboarding, pero escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene su propio:

- archivo de configuración
- directorio de estado
- espacio de trabajo (de forma predeterminada `~/.openclaw/workspace-rescue`)
- nombre de servicio administrado

Por lo demás, los prompts son los mismos que en el onboarding normal.

## Configuración general de varios Gateways

La disposición del bot de rescate anterior es la opción predeterminada más sencilla, pero el mismo patrón de aislamiento funciona para cualquier par o grupo de Gateways en un mismo host.

Para una configuración más general, asigna a cada Gateway adicional su propio perfil con nombre y su propio puerto base:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si quieres que ambos Gateways usen perfiles con nombre, eso también funciona:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Los servicios siguen el mismo patrón:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Usa el inicio rápido del bot de rescate cuando quieras una vía operativa de respaldo. Usa el patrón general de perfiles cuando quieras varios Gateways persistentes para distintos canales, tenants, espacios de trabajo o funciones operativas.

## Lista de verificación de aislamiento

Mantén estos elementos únicos por instancia de Gateway:

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales y cachés por instancia
- `agents.defaults.workspace` — raíz del espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- puertos derivados de browser/canvas/CDP

Si se comparten, tendrás condiciones de carrera de configuración y conflictos de puertos.

## Mapeo de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del browser = base + 2 (solo loopback local)
- el host de canvas se sirve en el servidor HTTP del Gateway (mismo puerto que `gateway.port`)
- los puertos CDP del perfil del browser se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sobrescribes cualquiera de estos en la configuración o en variables de entorno, debes mantenerlos únicos por instancia.

## Notas sobre browser/CDP (error común)

- **No** fijes `browser.cdpUrl` a los mismos valores en varias instancias.
- Cada instancia necesita su propio puerto de control del browser y su propio rango de CDP (derivado de su puerto del gateway).
- Si necesitas puertos CDP explícitos, establece `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: usa `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

## Ejemplo manual con variables de entorno

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Comprobaciones rápidas

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interpretación:

- `gateway status --deep` ayuda a detectar servicios obsoletos de launchd/systemd/schtasks de instalaciones anteriores.
- El texto de advertencia de `gateway probe`, como `multiple reachable gateways detected`, es esperable solo cuando ejecutas intencionalmente más de un gateway aislado.

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Bloqueo del Gateway](/es/gateway/gateway-lock)
- [Configuración](/es/gateway/configuration)
