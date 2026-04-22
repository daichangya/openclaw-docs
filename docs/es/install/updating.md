---
read_when:
    - Actualización de OpenClaw
    - Algo se rompe después de una actualización
summary: Actualización segura de OpenClaw (instalación global o desde código fuente), más estrategia de reversión
title: Actualización
x-i18n:
    generated_at: "2026-04-22T04:23:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Actualización

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

`--channel beta` prefiere beta, pero el tiempo de ejecución recurre a stable/latest cuando
falta la etiqueta beta o es más antigua que la versión estable más reciente. Usa `--tag beta`
si quieres la dist-tag beta sin procesar de npm para una actualización puntual del paquete.

Consulta [Canales de desarrollo](/es/install/development-channels) para ver la semántica de canales.

## Alternativa: volver a ejecutar el instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Añade `--no-onboard` para omitir el onboarding. Para instalaciones desde código fuente, pasa `--install-method git --no-onboard`.

## Alternativa: npm, pnpm o bun manual

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Instalaciones globales de npm propiedad de root

Algunas configuraciones de npm en Linux instalan paquetes globales en directorios propiedad de root como
`/usr/lib/node_modules/openclaw`. OpenClaw admite esa disposición: el paquete
instalado se trata como de solo lectura en tiempo de ejecución, y las
dependencias de tiempo de ejecución del Plugin incluido se preparan en un directorio de tiempo de ejecución con permisos de escritura en lugar de mutar el árbol del paquete.

Para unidades systemd reforzadas, configura un directorio de preparación con permisos de escritura que esté incluido en
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` no está configurado, OpenClaw usa `$STATE_DIRECTORY` cuando
systemd lo proporciona, y luego recurre a `~/.openclaw/plugin-runtime-deps`.

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

| Canal    | Comportamiento                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Espera `stableDelayHours`, luego aplica con jitter determinista a lo largo de `stableJitterHours` (despliegue distribuido). |
| `beta`   | Comprueba cada `betaCheckIntervalHours` (predeterminado: cada hora) y aplica de inmediato.                    |
| `dev`    | No hay aplicación automática. Usa `openclaw update` manualmente.                                               |

El gateway también registra una sugerencia de actualización al iniciar (desactívala con `update.checkOnStart: false`).

## Después de actualizar

<Steps>

### Ejecutar doctor

```bash
openclaw doctor
```

Migra la configuración, audita las políticas de mensajes directos y comprueba el estado del gateway. Detalles: [Doctor](/es/gateway/doctor)

### Reiniciar el gateway

```bash
openclaw gateway restart
```

### Verificar

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

## Si estás atascado

- Vuelve a ejecutar `openclaw doctor` y lee atentamente la salida.
- Para `openclaw update --channel dev` en copias de trabajo de código fuente, el actualizador inicializa automáticamente `pnpm` cuando es necesario. Si ves un error de inicialización de pnpm/corepack, instala `pnpm` manualmente (o vuelve a habilitar `corepack`) y vuelve a ejecutar la actualización.
- Consulta: [Solución de problemas](/es/gateway/troubleshooting)
- Pregunta en Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Resumen de instalación](/es/install) — todos los métodos de instalación
- [Doctor](/es/gateway/doctor) — comprobaciones de estado después de las actualizaciones
- [Migración](/es/install/migrating) — guías de migración de versiones principales
