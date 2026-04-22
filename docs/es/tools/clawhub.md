---
read_when:
    - Presentando ClawHub a nuevos usuarios
    - Instalando, buscando o publicando Skills o plugins
    - Explicando los indicadores de la CLI de ClawHub y el comportamiento de sincronización
summary: 'Guía de ClawHub: registro público, flujos de instalación nativos de OpenClaw y flujos de trabajo de la CLI de ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub es el registro público de **Skills y plugins de OpenClaw**.

- Usa comandos nativos de `openclaw` para buscar/instalar/actualizar Skills e instalar
  plugins desde ClawHub.
- Usa la CLI separada `clawhub` cuando necesites autenticación del registro, publicar, eliminar,
  restaurar o flujos de trabajo de sincronización.

Sitio: [clawhub.ai](https://clawhub.ai)

## Flujos nativos de OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Las especificaciones de Plugin simples compatibles con npm también se prueban primero contra ClawHub antes que npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Los comandos nativos de `openclaw` instalan en tu workspace activo y conservan metadatos de origen
para que llamadas posteriores a `update` puedan seguir usando ClawHub.

Las instalaciones de Plugin validan la compatibilidad anunciada de `pluginApi` y `minGatewayVersion`
antes de ejecutar la instalación del archivo, de modo que los hosts incompatibles fallen de forma cerrada desde el principio en lugar de instalar parcialmente el paquete.

`openclaw plugins install clawhub:...` solo acepta familias de plugins instalables.
Si un paquete de ClawHub en realidad es una Skill, OpenClaw se detiene y te indica que uses
`openclaw skills install <slug>` en su lugar.

## Qué es ClawHub

- Un registro público para Skills y plugins de OpenClaw.
- Un almacén versionado de paquetes de Skills y metadatos.
- Una superficie de descubrimiento para búsqueda, etiquetas y señales de uso.

## Cómo funciona

1. Un usuario publica un paquete de Skill (archivos + metadatos).
2. ClawHub almacena el paquete, analiza los metadatos y asigna una versión.
3. El registro indexa la Skill para búsqueda y descubrimiento.
4. Los usuarios exploran, descargan e instalan Skills en OpenClaw.

## Qué puedes hacer

- Publicar Skills nuevas y nuevas versiones de Skills existentes.
- Descubrir Skills por nombre, etiquetas o búsqueda.
- Descargar paquetes de Skills e inspeccionar sus archivos.
- Denunciar Skills abusivas o inseguras.
- Si eres moderador, ocultar, mostrar, eliminar o bloquear.

## Para quién es esto (apto para principiantes)

Si quieres añadir nuevas capacidades a tu agente de OpenClaw, ClawHub es la forma más sencilla de encontrar e instalar Skills. No necesitas saber cómo funciona el backend. Puedes:

- Buscar Skills con lenguaje natural.
- Instalar una Skill en tu workspace.
- Actualizar Skills más adelante con un solo comando.
- Respaldar tus propias Skills publicándolas.

## Inicio rápido (no técnico)

1. Busca algo que necesites:
   - `openclaw skills search "calendar"`
2. Instala una Skill:
   - `openclaw skills install <skill-slug>`
3. Inicia una nueva sesión de OpenClaw para que detecte la nueva Skill.
4. Si quieres publicar o gestionar autenticación del registro, instala también la
   CLI separada `clawhub`.

## Instalar la CLI de ClawHub

Solo la necesitas para flujos autenticados del registro como publicar/sincronizar:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Cómo encaja en OpenClaw

La instalación nativa `openclaw skills install` instala en el directorio `skills/`
del workspace activo. `openclaw plugins install clawhub:...` registra una instalación
normal gestionada de Plugin más metadatos de origen de ClawHub para actualizaciones.

Las instalaciones anónimas de plugins de ClawHub también fallan de forma cerrada para paquetes privados.
Los canales comunitarios u otros no oficiales todavía pueden instalarse, pero OpenClaw advierte
para que los operadores puedan revisar el origen y la verificación antes de habilitarlos.

La CLI separada `clawhub` también instala Skills en `./skills` bajo tu
directorio de trabajo actual. Si se configura un workspace de OpenClaw, `clawhub`
recurre a ese workspace a menos que sobrescribas `--workdir` (o
`CLAWHUB_WORKDIR`). OpenClaw carga las Skills del workspace desde `<workspace>/skills`
y las detectará en la **siguiente** sesión. Si ya usas
`~/.openclaw/skills` o Skills incluidas, las Skills del workspace tienen prioridad.

Para más detalles sobre cómo se cargan, comparten y restringen las Skills, consulta
[Skills](/es/tools/skills).

## Resumen del sistema de Skills

Una Skill es un paquete versionado de archivos que enseña a OpenClaw cómo realizar una
tarea específica. Cada publicación crea una nueva versión, y el registro conserva un
historial de versiones para que los usuarios puedan auditar cambios.

Una Skill típica incluye:

- Un archivo `SKILL.md` con la descripción principal y el uso.
- Configuraciones, scripts o archivos de soporte opcionales usados por la Skill.
- Metadatos como etiquetas, resumen y requisitos de instalación.

ClawHub usa metadatos para impulsar el descubrimiento y exponer de forma segura las capacidades de la Skill.
El registro también rastrea señales de uso (como estrellas y descargas) para mejorar
la clasificación y la visibilidad.

## Qué ofrece el servicio (funciones)

- **Exploración pública** de Skills y su contenido `SKILL.md`.
- **Búsqueda** impulsada por embeddings (búsqueda vectorial), no solo por palabras clave.
- **Versionado** con semver, changelogs y etiquetas (incluida `latest`).
- **Descargas** como zip por versión.
- **Estrellas y comentarios** para retroalimentación de la comunidad.
- **Hooks de moderación** para aprobaciones y auditorías.
- **API apta para CLI** para automatización y scripts.

## Seguridad y moderación

ClawHub es abierto por defecto. Cualquiera puede subir Skills, pero una cuenta de GitHub debe
tener al menos una semana de antigüedad para publicar. Esto ayuda a frenar el abuso sin bloquear
a colaboradores legítimos.

Denuncias y moderación:

- Cualquier usuario autenticado puede denunciar una Skill.
- Los motivos de denuncia son obligatorios y se registran.
- Cada usuario puede tener hasta 20 denuncias activas a la vez.
- Las Skills con más de 3 denuncias únicas se ocultan automáticamente por defecto.
- Los moderadores pueden ver Skills ocultas, mostrarlas, eliminarlas o bloquear usuarios.
- Abusar de la función de denuncia puede resultar en bloqueos de cuenta.

¿Te interesa convertirte en moderador? Pregunta en el Discord de OpenClaw y contacta con un
moderador o mantenedor.

## Comandos y parámetros de la CLI

Opciones globales (se aplican a todos los comandos):

- `--workdir <dir>`: directorio de trabajo (predeterminado: directorio actual; recurre al workspace de OpenClaw).
- `--dir <dir>`: directorio de Skills, relativo a workdir (predeterminado: `skills`).
- `--site <url>`: URL base del sitio (login en navegador).
- `--registry <url>`: URL base de la API del registro.
- `--no-input`: deshabilitar prompts (no interactivo).
- `-V, --cli-version`: imprimir la versión de la CLI.

Autenticación:

- `clawhub login` (flujo de navegador) o `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opciones:

- `--token <token>`: pegar un token de API.
- `--label <label>`: etiqueta almacenada para tokens de login por navegador (predeterminado: `CLI token`).
- `--no-browser`: no abrir un navegador (requiere `--token`).

Búsqueda:

- `clawhub search "query"`
- `--limit <n>`: máximo de resultados.

Instalación:

- `clawhub install <slug>`
- `--version <version>`: instalar una versión específica.
- `--force`: sobrescribir si la carpeta ya existe.

Actualización:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: actualizar a una versión específica (solo un slug).
- `--force`: sobrescribir cuando los archivos locales no coincidan con ninguna versión publicada.

Lista:

- `clawhub list` (lee `.clawhub/lock.json`)

Publicar Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug de la Skill.
- `--name <name>`: nombre visible.
- `--version <version>`: versión semver.
- `--changelog <text>`: texto del changelog (puede estar vacío).
- `--tags <tags>`: etiquetas separadas por comas (predeterminado: `latest`).

Publicar plugins:

- `clawhub package publish <source>`
- `<source>` puede ser una carpeta local, `owner/repo`, `owner/repo@ref` o una URL de GitHub.
- `--dry-run`: construir el plan exacto de publicación sin subir nada.
- `--json`: emitir salida legible por máquina para CI.
- `--source-repo`, `--source-commit`, `--source-ref`: anulaciones opcionales cuando la detección automática no es suficiente.

Eliminar/restaurar (solo propietario/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronizar (escanear Skills locales + publicar nuevas/actualizadas):

- `clawhub sync`
- `--root <dir...>`: raíces extra de escaneo.
- `--all`: subir todo sin prompts.
- `--dry-run`: mostrar qué se subiría.
- `--bump <type>`: `patch|minor|major` para actualizaciones (predeterminado: `patch`).
- `--changelog <text>`: changelog para actualizaciones no interactivas.
- `--tags <tags>`: etiquetas separadas por comas (predeterminado: `latest`).
- `--concurrency <n>`: comprobaciones del registro (predeterminado: 4).

## Flujos de trabajo comunes para agentes

### Buscar Skills

```bash
clawhub search "postgres backups"
```

### Descargar nuevas Skills

```bash
clawhub install my-skill-pack
```

### Actualizar Skills instaladas

```bash
clawhub update --all
```

### Respaldar tus Skills (publicar o sincronizar)

Para una sola carpeta de Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para escanear y respaldar muchas Skills a la vez:

```bash
clawhub sync --all
```

### Publicar un Plugin desde GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Los plugins de código deben incluir los metadatos requeridos de OpenClaw en `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Los paquetes publicados deberían incluir JavaScript compilado y apuntar `runtimeExtensions`
a esa salida. Las instalaciones desde copias de trabajo git aún pueden recurrir al código TypeScript
cuando no existan archivos compilados, pero las entradas de tiempo de ejecución compiladas evitan la
compilación TypeScript en tiempo de ejecución en rutas de inicio, doctor y carga de plugins.

## Detalles avanzados (técnicos)

### Versionado y etiquetas

- Cada publicación crea una nueva `SkillVersion` **semver**.
- Las etiquetas (como `latest`) apuntan a una versión; mover etiquetas te permite revertir.
- Los changelogs se adjuntan por versión y pueden estar vacíos al sincronizar o publicar actualizaciones.

### Cambios locales frente a versiones del registro

Las actualizaciones comparan el contenido local de la Skill con las versiones del registro usando un hash de contenido. Si los archivos locales no coinciden con ninguna versión publicada, la CLI pregunta antes de sobrescribir (o requiere `--force` en ejecuciones no interactivas).

### Escaneo de sync y raíces de reserva

`clawhub sync` escanea primero tu workdir actual. Si no encuentra Skills, recurre a ubicaciones heredadas conocidas (por ejemplo `~/openclaw/skills` y `~/.openclaw/skills`). Esto está diseñado para encontrar instalaciones antiguas de Skills sin indicadores adicionales.

### Almacenamiento y archivo de bloqueo

- Las Skills instaladas se registran en `.clawhub/lock.json` dentro de tu workdir.
- Los tokens de autenticación se almacenan en el archivo de configuración de la CLI de ClawHub (sobrescribir con `CLAWHUB_CONFIG_PATH`).

### Telemetría (recuentos de instalación)

Cuando ejecutas `clawhub sync` con sesión iniciada, la CLI envía una instantánea mínima para calcular recuentos de instalación. Puedes desactivarlo por completo:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variables de entorno

- `CLAWHUB_SITE`: sobrescribir la URL del sitio.
- `CLAWHUB_REGISTRY`: sobrescribir la URL de la API del registro.
- `CLAWHUB_CONFIG_PATH`: sobrescribir dónde almacena la CLI el token/la configuración.
- `CLAWHUB_WORKDIR`: sobrescribir el workdir predeterminado.
- `CLAWHUB_DISABLE_TELEMETRY=1`: deshabilitar la telemetría en `sync`.
