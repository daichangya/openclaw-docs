---
read_when:
    - Quieres instalar o gestionar Plugins de Gateway o paquetes compatibles
    - Quieres depurar fallos de carga de Plugins
summary: Referencia de la CLI para `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestiona Plugins de Gateway, paquetes de hooks y paquetes compatibles.

Relacionado:

- Sistema de Plugins: [Plugins](/es/tools/plugin)
- Compatibilidad de paquetes: [Paquetes de Plugins](/es/plugins/bundles)
- Manifest y esquema de Plugin: [Manifest de Plugin](/es/plugins/manifest)
- Refuerzo de seguridad: [Seguridad](/es/gateway/security)

## Comandos

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Los Plugins incluidos se distribuyen con OpenClaw. Algunos están habilitados de forma predeterminada (por ejemplo, los proveedores de modelos incluidos, los proveedores de voz incluidos y el Plugin de navegador incluido); otros requieren `plugins enable`.

Los Plugins nativos de OpenClaw deben incluir `openclaw.plugin.json` con un esquema JSON en línea (`configSchema`, incluso si está vacío). Los paquetes compatibles usan sus propios manifests de paquete en su lugar.

`plugins list` muestra `Format: openclaw` o `Format: bundle`. La salida detallada de list/info también muestra el subtipo del paquete (`codex`, `claude` o `cursor`) además de las capacidades del paquete detectadas.

### Instalar

```bash
openclaw plugins install <package>                      # ClawHub primero, luego npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sobrescribe una instalación existente
openclaw plugins install <package> --pin                # fija la versión
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ruta local
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explícito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Los nombres de paquete sin prefijo se comprueban primero en ClawHub y luego en npm. Nota de seguridad: trata las instalaciones de Plugins como ejecución de código. Prefiere versiones fijadas.

Si tu sección `plugins` está respaldada por un único `$include` de archivo, `plugins install/update/enable/disable/uninstall` escribe en ese archivo incluido y deja `openclaw.json` intacto. Los includes raíz, los arrays de includes y los includes con sobrescrituras hermanas fallan de forma cerrada en lugar de aplanarse. Consulta [Config includes](/es/gateway/configuration) para ver las formas compatibles.

Si la configuración no es válida, `plugins install` normalmente falla de forma cerrada y te indica que primero ejecutes `openclaw doctor --fix`. La única excepción documentada es una ruta limitada de recuperación de Plugin incluido para Plugins que optan explícitamente por `openclaw.install.allowInvalidConfigRecovery`.

`--force` reutiliza el destino de instalación existente y sobrescribe en su lugar un Plugin o paquete de hooks ya instalado. Úsalo cuando quieras reinstalar intencionalmente el mismo id desde una nueva ruta local, archivo, paquete de ClawHub o artefacto de npm. Para actualizaciones rutinarias de un Plugin de npm ya rastreado, prefiere `openclaw plugins update <id-or-npm-spec>`.

Si ejecutas `plugins install` para un id de Plugin que ya está instalado, OpenClaw se detiene y te dirige a `plugins update <id-or-npm-spec>` para una actualización normal, o a `plugins install <package> --force` cuando realmente quieres sobrescribir la instalación actual desde otra fuente.

`--pin` se aplica solo a instalaciones desde npm. No es compatible con `--marketplace`, porque las instalaciones desde marketplace conservan metadatos del origen del marketplace en lugar de una especificación de npm.

`--dangerously-force-unsafe-install` es una opción de emergencia para falsos positivos en el escáner integrado de código peligroso. Permite que la instalación continúe incluso cuando el escáner integrado informa hallazgos `critical`, pero **no** omite los bloqueos de políticas de hooks `before_install` del Plugin y **no** omite fallos de escaneo.

Esta bandera de CLI se aplica a los flujos de instalación/actualización de Plugins. Las instalaciones de dependencias de Skills respaldadas por Gateway usan la anulación de solicitud equivalente `dangerouslyForceUnsafeInstall`, mientras que `openclaw skills install` sigue siendo un flujo independiente de descarga/instalación de Skills desde ClawHub.

`plugins install` también es la superficie de instalación para paquetes de hooks que exponen `openclaw.hooks` en `package.json`. Usa `openclaw hooks` para la visibilidad filtrada de hooks y la habilitación por hook, no para la instalación del paquete.

Las especificaciones de npm son **solo de registro** (nombre del paquete + **versión exacta** opcional o **dist-tag**). Las especificaciones git/URL/file y los rangos semver se rechazan. Las instalaciones de dependencias se ejecutan con `--ignore-scripts` por seguridad.

Las especificaciones sin prefijo y `@latest` permanecen en la línea estable. Si npm resuelve cualquiera de ellas a una versión preliminar, OpenClaw se detiene y te pide que optes explícitamente por ella con una etiqueta de preliminar como `@beta`/`@rc` o una versión preliminar exacta como `@1.2.3-beta.4`.

Si una especificación de instalación sin prefijo coincide con el id de un Plugin incluido (por ejemplo, `diffs`), OpenClaw instala ese Plugin incluido directamente. Para instalar un paquete de npm con el mismo nombre, usa una especificación con scope explícito (por ejemplo, `@scope/diffs`).

Archivos compatibles: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

También se admiten instalaciones desde el marketplace de Claude.

Las instalaciones desde ClawHub usan un localizador explícito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ahora también prefiere ClawHub para especificaciones de Plugin válidas para npm sin prefijo. Solo recurre a npm si ClawHub no tiene ese paquete o versión:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw descarga el archivo del paquete desde ClawHub, comprueba la compatibilidad anunciada de la API de Plugin / mínima de gateway y luego lo instala mediante la ruta normal de archivos. Las instalaciones registradas conservan sus metadatos de origen de ClawHub para futuras actualizaciones.

Usa la forma abreviada `plugin@marketplace` cuando el nombre del marketplace exista en la caché de registro local de Claude en `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` cuando quieras pasar explícitamente el origen del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Los orígenes del marketplace pueden ser:

- un nombre de marketplace conocido por Claude desde `~/.claude/plugins/known_marketplaces.json`
- una raíz de marketplace local o una ruta a `marketplace.json`
- una forma abreviada de repositorio de GitHub como `owner/repo`
- una URL de repositorio de GitHub como `https://github.com/owner/repo`
- una URL de git

Para marketplaces remotos cargados desde GitHub o git, las entradas de Plugin deben permanecer dentro del repositorio clonado del marketplace. OpenClaw acepta orígenes de rutas relativas desde ese repositorio y rechaza orígenes HTTP(S), rutas absolutas, git, GitHub y otros orígenes de Plugin que no sean rutas provenientes de manifests remotos.

Para rutas locales y archivos, OpenClaw detecta automáticamente:

- Plugins nativos de OpenClaw (`openclaw.plugin.json`)
- paquetes compatibles con Codex (`.codex-plugin/plugin.json`)
- paquetes compatibles con Claude (`.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude)
- paquetes compatibles con Cursor (`.cursor-plugin/plugin.json`)

Los paquetes compatibles se instalan en la raíz normal de Plugins y participan en el mismo flujo de list/info/enable/disable. Actualmente, se admiten bundle skills, command-skills de Claude, valores predeterminados de Claude `settings.json`, valores predeterminados de Claude `.lsp.json` / `lspServers` declarados en el manifest, command-skills de Cursor y directorios de hooks de Codex compatibles; otras capacidades de paquetes detectadas se muestran en los diagnósticos/info, pero todavía no están conectadas a la ejecución en tiempo de ejecución.

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` para mostrar solo los Plugins cargados. Usa `--verbose` para cambiar de la vista de tabla a líneas de detalle por Plugin con metadatos de source/origin/version/activation. Usa `--json` para obtener un inventario legible por máquina más diagnósticos del registro.

`plugins list` ejecuta el descubrimiento desde el entorno y la configuración actuales de la CLI. Es útil para comprobar si un Plugin está habilitado o se puede cargar, pero no es una sonda activa del tiempo de ejecución de un proceso Gateway ya en ejecución. Después de cambiar código de Plugin, habilitación, política de hooks o `plugins.load.paths`, reinicia el Gateway que sirve el canal antes de esperar que se ejecute nuevo código `register(api)` o hooks. Para despliegues remotos o en contenedor, verifica que estás reiniciando el proceso hijo real `openclaw gateway run`, no solo un proceso contenedor.

Para depurar hooks en tiempo de ejecución:

- `openclaw plugins inspect <id> --json` muestra hooks registrados y diagnósticos de una pasada de inspección con el módulo cargado.
- `openclaw gateway status --deep --require-rpc` confirma el Gateway alcanzable, sugerencias de servicio/proceso, ruta de configuración y estado de RPC.
- Los hooks de conversación no incluidos (`llm_input`, `llm_output`, `agent_end`) requieren `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` para evitar copiar un directorio local (lo añade a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` no es compatible con `--link` porque las instalaciones enlazadas reutilizan la ruta de origen en lugar de copiar sobre un destino de instalación gestionado.

Usa `--pin` en instalaciones desde npm para guardar la especificación exacta resuelta (`name@version`) en `plugins.installs` mientras se mantiene el comportamiento predeterminado sin fijar.

### Desinstalar

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` elimina registros de Plugin de `plugins.entries`, `plugins.installs`, la lista de permitidos de Plugins y las entradas enlazadas de `plugins.load.paths` cuando corresponda. Para Plugins de Active Memory, la ranura de memoria se restablece a `memory-core`.

De forma predeterminada, uninstall también elimina el directorio de instalación del Plugin bajo la raíz de Plugins del directorio de estado activo. Usa `--keep-files` para conservar los archivos en disco.

`--keep-config` es compatible como alias obsoleto de `--keep-files`.

### Actualizar

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Las actualizaciones se aplican a las instalaciones rastreadas en `plugins.installs` y a las instalaciones rastreadas de paquetes de hooks en `hooks.internal.installs`.

Cuando pasas un id de Plugin, OpenClaw reutiliza la especificación de instalación registrada para ese Plugin. Eso significa que las dist-tags almacenadas previamente, como `@beta`, y las versiones exactas fijadas se siguen usando en ejecuciones posteriores de `update <id>`.

Para instalaciones desde npm, también puedes pasar una especificación explícita de paquete npm con una dist-tag o una versión exacta. OpenClaw resuelve ese nombre de paquete de vuelta al registro de Plugin rastreado, actualiza ese Plugin instalado y registra la nueva especificación de npm para futuras actualizaciones basadas en id.

Pasar el nombre del paquete npm sin una versión o etiqueta también lo resuelve de vuelta al registro de Plugin rastreado. Usa esto cuando un Plugin se fijó a una versión exacta y quieres devolverlo a la línea de versión predeterminada del registro.

Antes de una actualización real desde npm, OpenClaw comprueba la versión del paquete instalado frente a los metadatos del registro de npm. Si la versión instalada y la identidad del artefacto registrado ya coinciden con el destino resuelto, la actualización se omite sin descargar, reinstalar ni reescribir `openclaw.json`.

Cuando existe un hash de integridad almacenado y cambia el hash del artefacto obtenido, OpenClaw trata esto como una deriva del artefacto de npm. El comando interactivo `openclaw plugins update` imprime los hashes esperado y real, y solicita confirmación antes de continuar. Los asistentes de actualización no interactivos fallan de forma cerrada a menos que quien los invoque proporcione una política explícita de continuación.

`--dangerously-force-unsafe-install` también está disponible en `plugins update` como una anulación de emergencia para falsos positivos del escaneo integrado de código peligroso durante actualizaciones de Plugins. Sigue sin omitir los bloqueos de políticas `before_install` del Plugin ni el bloqueo por fallos de escaneo, y solo se aplica a actualizaciones de Plugins, no a actualizaciones de paquetes de hooks.

### Inspeccionar

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspección profunda de un único Plugin. Muestra identidad, estado de carga, origen, capacidades registradas, hooks, herramientas, comandos, servicios, métodos de gateway, rutas HTTP, indicadores de políticas, diagnósticos, metadatos de instalación, capacidades del paquete y cualquier compatibilidad detectada con servidores MCP o LSP.

Cada Plugin se clasifica según lo que registra realmente en tiempo de ejecución:

- **plain-capability** — un tipo de capacidad (por ejemplo, un Plugin solo de proveedor)
- **hybrid-capability** — varios tipos de capacidad (por ejemplo, texto + voz + imágenes)
- **hook-only** — solo hooks, sin capacidades ni superficies
- **non-capability** — herramientas/comandos/servicios, pero sin capacidades

Consulta [Formas de Plugin](/es/plugins/architecture#plugin-shapes) para obtener más información sobre el modelo de capacidades.

La bandera `--json` genera un informe legible por máquina adecuado para scripting y auditoría.

`inspect --all` muestra una tabla de todo el conjunto con columnas de forma, tipos de capacidad, avisos de compatibilidad, capacidades del paquete y resumen de hooks.

`info` es un alias de `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` informa errores de carga de Plugins, diagnósticos de manifest/descubrimiento y avisos de compatibilidad. Cuando todo está correcto, imprime `No plugin issues detected.`

Para fallos de forma de módulo, como exportaciones `register`/`activate` ausentes, vuelve a ejecutar con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` para incluir un resumen compacto de la forma de las exportaciones en la salida de diagnóstico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

La lista de marketplace acepta una ruta a un marketplace local, una ruta a `marketplace.json`, una forma abreviada de GitHub como `owner/repo`, una URL de repositorio de GitHub o una URL de git. `--json` imprime la etiqueta del origen resuelto junto con el manifest del marketplace analizado y las entradas de Plugins.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Creación de Plugins](/es/plugins/building-plugins)
- [Plugins de la comunidad](/es/plugins/community)
