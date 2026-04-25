---
read_when:
    - Tienes problemas de conectividad/autenticación y quieres correcciones guiadas
    - Has actualizado y quieres una comprobación rápida de funcionamiento
summary: Referencia de la CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Comprobaciones de estado + correcciones rápidas para el gateway y los canales.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Ejemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opciones

- `--no-workspace-suggestions`: desactiva las sugerencias de memoria/búsqueda del espacio de trabajo
- `--yes`: acepta los valores predeterminados sin pedir confirmación
- `--repair`: aplica las reparaciones recomendadas sin pedir confirmación
- `--fix`: alias de `--repair`
- `--force`: aplica reparaciones agresivas, incluida la sobrescritura de configuraciones de servicio personalizadas cuando sea necesario
- `--non-interactive`: ejecuta sin solicitudes; solo migraciones seguras
- `--generate-gateway-token`: genera y configura un token de gateway
- `--deep`: analiza servicios del sistema para detectar instalaciones adicionales del gateway

Notas:

- Las solicitudes interactivas (como correcciones de llavero/OAuth) solo se ejecutan cuando stdin es un TTY y **no** se establece `--non-interactive`. Las ejecuciones sin interfaz (Cron, Telegram, sin terminal) omitirán las solicitudes.
- Rendimiento: las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando completamente los plugins cuando una comprobación necesita su contribución.
- `--fix` (alias de `--repair`) escribe una copia de seguridad en `~/.openclaw/openclaw.json.bak` y elimina claves de configuración desconocidas, enumerando cada eliminación.
- Las comprobaciones de integridad del estado ahora detectan archivos de transcript huérfanos en el directorio de sesiones y pueden archivarlos como `.deleted.<timestamp>` para recuperar espacio de forma segura.
- Doctor también analiza `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos Cron y puede reescribirlos en el lugar antes de que el programador tenga que normalizarlos automáticamente en tiempo de ejecución.
- Doctor repara dependencias de tiempo de ejecución faltantes de plugins incluidos sin escribir en instalaciones globales empaquetadas. Para instalaciones npm con propietario root o unidades systemd endurecidas, establece `OPENCLAW_PLUGIN_STAGE_DIR` en un directorio con permisos de escritura, como `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`.
- Las ejecuciones repetidas de `doctor --fix` ya no informan/aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de disponibilidad de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan credenciales de embeddings.
- Si el modo sandbox está habilitado pero Docker no está disponible, doctor informa una advertencia de alta señal con la corrección (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados por SecretRef y no están disponibles en la ruta de comando actual, doctor informa una advertencia de solo lectura y no escribe credenciales de respaldo en texto plano.
- Si la inspección de SecretRef del canal falla en una ruta de corrección, doctor continúa e informa una advertencia en lugar de salir antes de tiempo.
- La autorresolución de nombre de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta de comando actual. Si la inspección del token no está disponible, doctor informa una advertencia y omite la autorresolución en esa ejecución.

## macOS: sobrescrituras de entorno de `launchctl`

Si ejecutaste antes `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor sobrescribe tu archivo de configuración y puede causar errores persistentes de “no autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de CLI](/es/cli)
- [Doctor del gateway](/es/gateway/doctor)
