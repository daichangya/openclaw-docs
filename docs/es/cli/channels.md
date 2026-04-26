---
read_when:
    - Quieres agregar/eliminar cuentas de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Quieres comprobar el estado del canal o seguir los registros del canal
summary: Referencia de CLI para `openclaw channels` (cuentas, estado, inicio/cierre de sesión, registros)
title: Canales
x-i18n:
    generated_at: "2026-04-26T12:24:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Administra las cuentas de canales de chat y su estado de ejecución en el Gateway.

Documentación relacionada:

- Guías de canales: [Canales](/es/channels/index)
- Configuración del Gateway: [Configuración](/es/gateway/configuration)

## Comandos comunes

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Estado / capacidades / resolver / registros

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (solo con `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` es la ruta en vivo: en un gateway accesible ejecuta comprobaciones `probeAccount` por cuenta y comprobaciones opcionales `auditAccount`, por lo que la salida puede incluir el estado del transporte más resultados de prueba como `works`, `probe failed`, `audit ok` o `audit failed`.
Si no se puede acceder al gateway, `channels status` vuelve a resúmenes basados solo en la configuración en lugar de mostrar resultados de prueba en vivo.

## Agregar / eliminar cuentas

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Consejo: `openclaw channels add --help` muestra los indicadores específicos de cada canal (token, clave privada, token de aplicación, rutas de signal-cli, etc.).

Las superficies comunes de agregado no interactivo incluyen:

- canales con bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- campos de transporte de Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- campos de Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- campos de Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- campos de Nostr: `--private-key`, `--relay-urls`
- campos de Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` para autenticación respaldada por variables de entorno en la cuenta predeterminada, cuando sea compatible

Si es necesario instalar un Plugin de canal durante un comando `add` controlado por indicadores, OpenClaw usa la fuente de instalación predeterminada del canal sin abrir el aviso interactivo de instalación del Plugin.

Cuando ejecutas `openclaw channels add` sin indicadores, el asistente interactivo puede solicitar:

- IDs de cuenta por canal seleccionado
- nombres para mostrar opcionales para esas cuentas
- `Bind configured channel accounts to agents now?`

Si confirmas vincular ahora, el asistente pregunta qué agente debe poseer cada cuenta de canal configurada y escribe vinculaciones de enrutamiento con alcance de cuenta.

También puedes administrar esas mismas reglas de enrutamiento más adelante con `openclaw agents bindings`, `openclaw agents bind` y `openclaw agents unbind` (consulta [agents](/es/cli/agents)).

Cuando agregas una cuenta no predeterminada a un canal que todavía usa ajustes de nivel superior de cuenta única, OpenClaw promueve los valores de nivel superior con alcance de cuenta al mapa de cuentas del canal antes de escribir la nueva cuenta. La mayoría de los canales colocan esos valores en `channels.<channel>.accounts.default`, pero los canales incluidos pueden conservar en su lugar una cuenta promovida existente que coincida. Matrix es el ejemplo actual: si ya existe una cuenta con nombre, o si `defaultAccount` apunta a una cuenta con nombre existente, la promoción conserva esa cuenta en lugar de crear una nueva `accounts.default`.

El comportamiento de enrutamiento se mantiene coherente:

- Las vinculaciones existentes solo de canal (sin `accountId`) siguen coincidiendo con la cuenta predeterminada.
- `channels add` no crea ni reescribe vinculaciones automáticamente en modo no interactivo.
- La configuración interactiva puede agregar opcionalmente vinculaciones con alcance de cuenta.

Si tu configuración ya estaba en un estado mixto (cuentas con nombre presentes y valores de nivel superior de cuenta única aún establecidos), ejecuta `openclaw doctor --fix` para mover los valores con alcance de cuenta a la cuenta promovida elegida para ese canal. La mayoría de los canales promueven a `accounts.default`; Matrix puede conservar en su lugar un destino predeterminado o con nombre existente.

## Inicio / cierre de sesión (interactivo)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Notas:

- `channels login` admite `--verbose`.
- `channels login` / `logout` pueden inferir el canal cuando solo hay un destino de inicio de sesión compatible configurado.

## Solución de problemas

- Ejecuta `openclaw status --deep` para una prueba amplia.
- Usa `openclaw doctor` para correcciones guiadas.
- `openclaw channels list` imprime `Claude: HTTP 403 ... user:profile` → la instantánea de uso necesita el alcance `user:profile`. Usa `--no-usage`, o proporciona una clave de sesión de claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), o vuelve a autenticarte mediante Claude CLI.
- `openclaw channels status` vuelve a resúmenes basados solo en la configuración cuando no se puede acceder al gateway. Si una credencial de canal compatible está configurada mediante SecretRef pero no está disponible en la ruta actual del comando, informa esa cuenta como configurada con notas degradadas en lugar de mostrarla como no configurada.

## Prueba de capacidades

Obtén sugerencias de capacidades del proveedor (intenciones/alcances cuando estén disponibles) además de compatibilidad estática de funciones:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notas:

- `--channel` es opcional; omítelo para listar todos los canales (incluidas las extensiones).
- `--account` solo es válido con `--channel`.
- `--target` acepta `channel:<id>` o un ID numérico sin procesar de canal y solo se aplica a Discord.
- Las pruebas dependen del proveedor: intenciones de Discord + permisos opcionales del canal; alcances de bot y usuario de Slack; indicadores de bot + webhook de Telegram; versión del daemon de Signal; token de aplicación de Microsoft Teams + roles/alcances de Graph (anotados cuando se conocen). Los canales sin pruebas informan `Probe: unavailable`.

## Resolver nombres a IDs

Resuelve nombres de canal/usuario a IDs usando el directorio del proveedor:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notas:

- Usa `--kind user|group|auto` para forzar el tipo de destino.
- La resolución prefiere coincidencias activas cuando varias entradas comparten el mismo nombre.
- `channels resolve` es de solo lectura. Si una cuenta seleccionada está configurada mediante SecretRef pero esa credencial no está disponible en la ruta actual del comando, el comando devuelve resultados degradados no resueltos con notas en lugar de abortar toda la ejecución.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Resumen de canales](/es/channels)
