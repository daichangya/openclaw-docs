---
read_when:
    - Ejecutar más de un Gateway en la misma máquina
    - Necesita configuración/estado/puertos aislados por Gateway
summary: Ejecutar varios Gateways de OpenClaw en un solo host (aislamiento, puertos y perfiles)
title: Varios Gateways
x-i18n:
    generated_at: "2026-04-21T19:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Varios Gateways (mismo host)

La mayoría de las configuraciones deberían usar un solo Gateway porque un único Gateway puede gestionar varias conexiones de mensajería y agentes. Si necesita un aislamiento más fuerte o redundancia (por ejemplo, un bot de rescate), ejecute Gateways separados con perfiles y puertos aislados.

## Configuración recomendada principal

Para la mayoría de los usuarios, la configuración más simple para un bot de rescate es:

- mantener el bot principal en el perfil predeterminado
- ejecutar el bot de rescate con `--profile rescue`
- usar un bot de Telegram completamente separado para la cuenta de rescate
- mantener el bot de rescate en un puerto base diferente, como `19789`

Esto mantiene el bot de rescate aislado del bot principal para que pueda depurar o aplicar cambios de configuración si el bot principal deja de funcionar. Deje al menos 20 puertos entre los puertos base para que los puertos derivados de browser/canvas/CDP nunca entren en conflicto.

## Inicio rápido del bot de rescate

Use esto como la ruta predeterminada, a menos que tenga una razón de peso para hacer otra cosa:

```bash
# Bot de rescate (bot de Telegram separado, perfil separado, puerto 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si su bot principal ya está en ejecución, normalmente eso es todo lo que necesita.

Durante `openclaw --profile rescue onboard`:

- use el token del bot de Telegram separado
- mantenga el perfil `rescue`
- use un puerto base al menos 20 superior al del bot principal
- acepte el espacio de trabajo de rescate predeterminado, a menos que ya gestione uno usted mismo

Si el onboarding ya instaló el servicio de rescate por usted, el comando final `gateway install` no es necesario.

## Por qué esto funciona

El bot de rescate se mantiene independiente porque tiene su propio:

- perfil/configuración
- directorio de estado
- espacio de trabajo
- puerto base (más los puertos derivados)
- token del bot de Telegram

Para la mayoría de las configuraciones, use un bot de Telegram completamente separado para el perfil de rescate:

- fácil de mantener solo para operadores
- token e identidad del bot separados
- independiente de la instalación del canal/app del bot principal
- ruta de recuperación simple basada en DM cuando el bot principal está roto

## Qué cambia `--profile rescue onboard`

`openclaw --profile rescue onboard` usa el flujo de onboarding normal, pero escribe todo en un perfil separado.

En la práctica, eso significa que el bot de rescate obtiene su propio:

- archivo de configuración
- directorio de estado
- espacio de trabajo (de forma predeterminada `~/.openclaw/workspace-rescue`)
- nombre de servicio administrado

Por lo demás, las indicaciones son las mismas que en el onboarding normal.

## Configuración general de varios Gateways

La distribución del bot de rescate anterior es la opción predeterminada más sencilla, pero el mismo patrón de aislamiento funciona para cualquier par o grupo de Gateways en un mismo host.

Para una configuración más general, dé a cada Gateway adicional su propio perfil con nombre y su propio puerto base:

```bash
# principal (perfil predeterminado)
openclaw setup
openclaw gateway --port 18789

# gateway adicional
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si quiere que ambos Gateways usen perfiles con nombre, eso también funciona:

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

Use el inicio rápido del bot de rescate cuando quiera una vía de operador de respaldo. Use el patrón general de perfiles cuando quiera varios Gateways persistentes para distintos canales, tenants, espacios de trabajo o funciones operativas.

## Lista de verificación de aislamiento

Mantenga estos elementos únicos para cada instancia de Gateway:

- `OPENCLAW_CONFIG_PATH` — archivo de configuración por instancia
- `OPENCLAW_STATE_DIR` — sesiones, credenciales y cachés por instancia
- `agents.defaults.workspace` — raíz del espacio de trabajo por instancia
- `gateway.port` (o `--port`) — único por instancia
- puertos derivados de browser/canvas/CDP

Si estos se comparten, tendrá condiciones de carrera de configuración y conflictos de puertos.

## Asignación de puertos (derivados)

Puerto base = `gateway.port` (o `OPENCLAW_GATEWAY_PORT` / `--port`).

- puerto del servicio de control del navegador = base + 2 (solo loopback local)
- el host de canvas se sirve en el servidor HTTP del Gateway (mismo puerto que `gateway.port`)
- los puertos CDP del perfil del navegador se asignan automáticamente desde `browser.controlPort + 9 .. + 108`

Si sobrescribe cualquiera de estos en la configuración o en variables de entorno, debe mantenerlos únicos por instancia.

## Notas sobre browser/CDP (error común)

- **No** fije `browser.cdpUrl` a los mismos valores en varias instancias.
- Cada instancia necesita su propio puerto de control del navegador y su propio rango de CDP (derivado de su puerto de Gateway).
- Si necesita puertos CDP explícitos, configure `browser.profiles.<name>.cdpPort` por instancia.
- Chrome remoto: use `browser.profiles.<name>.cdpUrl` (por perfil, por instancia).

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

- `gateway status --deep` ayuda a detectar servicios launchd/systemd/schtasks obsoletos de instalaciones anteriores.
- El texto de advertencia de `gateway probe`, como `multiple reachable gateways detected`, es esperado solo cuando ejecuta intencionalmente más de un gateway aislado.
