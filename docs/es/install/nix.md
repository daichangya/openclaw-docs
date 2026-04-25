---
read_when:
    - Quieres instalaciones reproducibles y reversibles
    - Ya usas Nix/NixOS/Home Manager
    - Quieres que todo quede fijado y administrado de forma declarativa
summary: Instala OpenClaw de forma declarativa con Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:49:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

Instala OpenClaw de forma declarativa con **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — un módulo Home Manager con todo incluido.

<Info>
El repositorio [nix-openclaw](https://github.com/openclaw/nix-openclaw) es la fuente de verdad para la instalación con Nix. Esta página es un resumen rápido.
</Info>

## Qué obtienes

- Gateway + app de macOS + herramientas (whisper, spotify, cameras) -- todo fijado
- Servicio launchd que sobrevive a reinicios
- Sistema de plugins con configuración declarativa
- Reversión instantánea: `home-manager switch --rollback`

## Inicio rápido

<Steps>
  <Step title="Instalar Determinate Nix">
    Si Nix aún no está instalado, sigue las instrucciones del [instalador de Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Crear un flake local">
    Usa la plantilla agent-first del repositorio nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copia templates/agent-first/flake.nix desde el repositorio nix-openclaw
    ```
  </Step>
  <Step title="Configurar secretos">
    Configura el token de tu bot de mensajería y la API key del proveedor de modelos. Los archivos de texto plano en `~/.secrets/` funcionan bien.
  </Step>
  <Step title="Completar los placeholders de la plantilla y aplicar el cambio">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verificar">
    Confirma que el servicio launchd está en ejecución y que tu bot responde a los mensajes.
  </Step>
</Steps>

Consulta el [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) para ver todas las opciones y ejemplos del módulo.

## Comportamiento del runtime en modo Nix

Cuando `OPENCLAW_NIX_MODE=1` está definido (automático con nix-openclaw), OpenClaw entra en un modo determinista que desactiva los flujos de instalación automática.

También puedes configurarlo manualmente:

```bash
export OPENCLAW_NIX_MODE=1
```

En macOS, la app GUI no hereda automáticamente las variables de entorno del shell. Activa el modo Nix mediante defaults en su lugar:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Qué cambia en modo Nix

- Los flujos de instalación automática y automutación se desactivan
- Las dependencias faltantes muestran mensajes de corrección específicos de Nix
- La interfaz muestra un banner de modo Nix de solo lectura

### Rutas de configuración y estado

OpenClaw lee la configuración JSON5 desde `OPENCLAW_CONFIG_PATH` y almacena los datos mutables en `OPENCLAW_STATE_DIR`. Al ejecutarse bajo Nix, configura estos valores explícitamente en ubicaciones administradas por Nix para que el estado y la configuración del runtime permanezcan fuera del store inmutable.

| Variable               | Predeterminado                          |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Descubrimiento de PATH del servicio

El servicio launchd/systemd del gateway descubre automáticamente binarios del perfil de Nix para que
los plugins y herramientas que ejecutan binarios instalados con `nix` funcionen sin
configuración manual de PATH:

- Cuando `NIX_PROFILES` está definido, cada entrada se agrega al PATH del servicio con
  precedencia de derecha a izquierda (coincide con la precedencia del shell de Nix — la más a la derecha gana).
- Cuando `NIX_PROFILES` no está definido, `~/.nix-profile/bin` se agrega como fallback.

Esto se aplica tanto a los entornos de servicio launchd de macOS como a systemd de Linux.

## Relacionado

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- guía completa de configuración
- [Asistente](/es/start/wizard) -- configuración de CLI sin Nix
- [Docker](/es/install/docker) -- configuración en contenedor
