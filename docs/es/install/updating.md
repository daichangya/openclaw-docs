---
read_when:
    - Actualizar OpenClaw
    - Algo falla después de una actualización
summary: Actualizar OpenClaw de forma segura (instalación global o desde el código fuente), además de la estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-04-25T13:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Mantén OpenClaw actualizado.

## Recomendado: `openclaw update`

La forma más rápida de actualizar. Detecta tu tipo de instalación (npm o git), obtiene la versión más reciente, ejecuta `openclaw doctor` y reinicia el gateway.

```bash
openclaw update
```

Para cambiar de canal o apuntar a una versión específica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # vista previa sin aplicar
```

`--channel beta` prefiere beta, pero el runtime usa como respaldo stable/latest cuando
la etiqueta beta falta o es más antigua que la última versión estable. Usa `--tag beta`
si quieres el dist-tag beta bruto de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para ver la semántica de los canales.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir la incorporación. Para instalaciones desde código fuente, usa `--install-method git --no-onboard`.

## Alternativa: npm, pnpm o bun manuales

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalaciones globales con npm y dependencias de runtime

OpenClaw trata las instalaciones globales empaquetadas como de solo lectura en tiempo de ejecución, incluso cuando el
directorio global del paquete puede escribirse con el usuario actual. Las dependencias de runtime de los Plugins incluidos
se preparan en un directorio de runtime escribible en lugar de modificar el árbol del
paquete. Esto evita que `openclaw update` entre en conflicto con un gateway en ejecución o con un
agente local que esté reparando dependencias de Plugin durante la misma instalación.

Algunas configuraciones de npm en Linux instalan paquetes globales bajo directorios propiedad de root como
`/usr/lib/node_modules/openclaw`. OpenClaw admite ese diseño mediante la misma ruta
externa de preparación.

Para unidades systemd endurecidas, configura un directorio de preparación escribible incluido en
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` no está configurado, OpenClaw usa `$STATE_DIRECTORY` cuando
systemd lo proporciona y luego usa como respaldo `~/.openclaw/plugin-runtime-deps`.

### Dependencias de runtime de Plugins incluidos

Las instalaciones empaquetadas mantienen las dependencias de runtime de Plugins incluidos fuera del árbol
de paquetes de solo lectura. Al iniciar y durante `openclaw doctor --fix`, OpenClaw repara
las dependencias de runtime solo para Plugins incluidos que estén activos en la configuración, activos
a través de configuración heredada de canal o habilitados por el valor predeterminado de su manifiesto incluido.

La desactivación explícita tiene prioridad. Un Plugin o canal deshabilitado no recibe
sus dependencias de runtime reparadas solo porque exista en el paquete. Los Plugins externos
y las rutas de carga personalizadas siguen usando `openclaw plugins install` o
`openclaw plugins update`.

## Actualizador automático

El actualizador automático está desactivado de forma predeterminada. Habilítalo en `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Comportamiento                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours` y luego aplica con jitter determinista a lo largo de `stableJitterHours` (despliegue distribuido). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica inmediatamente.                  |
| `dev`    | No aplica automáticamente. Usa `openclaw update` manualmente.                                                 |

El gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).

## Después de actualizar

<Steps>

### Ejecuta doctor

```bash
openclaw doctor
```

Migra la configuración, audita las políticas de mensajes directos y comprueba el estado del gateway. Detalles: [Doctor](/es/gateway/doctor)

### Reinicia el gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Reversión

### Fijar una versión (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Consejo: `npm view openclaw version` muestra la versión publicada actual.

### Fijar un commit (código fuente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para volver a la última versión: `git checkout main && git pull`.

## Si estás bloqueado

- Ejecuta `openclaw doctor` otra vez y lee la salida con atención.
- Para `openclaw update --channel dev` en checkouts de código fuente, el actualizador inicializa automáticamente `pnpm` cuando hace falta. Si ves un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a habilitar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Descripción general de instalación](/es/install) — todos los métodos de instalación
- [Doctor](/es/gateway/doctor) — comprobaciones de estado después de actualizar
- [Migración](/es/install/migrating) — guías de migración de versiones principales
