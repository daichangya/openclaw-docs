---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cómo funciona el sandboxing de OpenClaw: modos, alcances, acceso al espacio de trabajo e imágenes'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:47:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw puede ejecutar **herramientas dentro de backends de sandbox** para reducir el radio de impacto.
Esto es **opcional** y se controla mediante configuración (`agents.defaults.sandbox` o
`agents.list[].sandbox`). Si el sandboxing está desactivado, las herramientas se ejecutan en el host.
El Gateway permanece en el host; la ejecución de herramientas se realiza en un sandbox aislado
cuando está habilitado.

No es un límite de seguridad perfecto, pero limita materialmente el acceso al sistema de archivos
y a procesos cuando el modelo hace algo torpe.

## Qué se ejecuta en sandbox

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional en sandbox (`agents.defaults.sandbox.browser`).
  - De forma predeterminada, el navegador del sandbox se inicia automáticamente (asegura que CDP sea accesible) cuando la herramienta de navegador lo necesita.
    Configúralo mediante `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - De forma predeterminada, los contenedores del navegador sandbox usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`.
    Configúralo con `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe el ingreso CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo `172.21.0.1/32`).
  - El acceso de observador por noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL con token de corta duración que sirve una página bootstrap local y abre noVNC con la contraseña en el fragmento de URL (no en registros de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones en sandbox apunten explícitamente al navegador del host.
  - Las listas de permitidos opcionales restringen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

No se ejecuta en sandbox:

- El propio proceso Gateway.
- Cualquier herramienta permitida explícitamente para ejecutarse fuera del sandbox (por ejemplo `tools.elevated`).
  - **Elevated exec omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino exec es `node`).**
  - Si el sandboxing está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Elevated Mode](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el sandboxing:

- `"off"`: sin sandboxing.
- `"non-main"`: sandbox solo para sesiones **no principales** (predeterminado si quieres chats normales en el host).
- `"all"`: todas las sesiones se ejecutan en un sandbox.
  Nota: `"non-main"` se basa en `session.mainKey` (predeterminado `"main"`), no en el ID del agente.
  Las sesiones de grupo/canal usan sus propias claves, por lo que cuentan como no principales y se ejecutarán en sandbox.

## Alcance

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones en sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el sandbox:

- `"docker"` (predeterminado cuando el sandboxing está habilitado): runtime local de sandbox respaldado por Docker.
- `"ssh"`: runtime genérico de sandbox remoto respaldado por SSH.
- `"openshell"`: runtime de sandbox respaldado por OpenShell.

La configuración específica de SSH está en `agents.defaults.sandbox.ssh`.
La configuración específica de OpenShell está en `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox gestionado por OpenShell                    |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host objetivo      | Plugin OpenShell habilitado                         |
| **Modelo de espacio de trabajo** | Montaje bind o copia             | Remoto canónico (siembra una vez) | `mirror` o `remote`                                 |
| **Control de red**  | `docker.network` (predeterminado: none) | Depende del host remoto        | Depende de OpenShell                                |
| **Navegador en sandbox** | Compatible                     | No compatible                  | Aún no compatible                                   |
| **Montajes bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Mejor para**      | Desarrollo local, aislamiento completo | Descargar trabajo a una máquina remota | Sandboxes remotos gestionados con sincronización bidireccional opcional |

### Backend Docker

El sandboxing está desactivado de forma predeterminada. Si habilitas el sandboxing y no eliges un
backend, OpenClaw usa el backend Docker. Ejecuta herramientas y navegadores sandbox
localmente mediante el socket del demonio Docker (`/var/run/docker.sock`). El aislamiento del contenedor
sandbox está determinado por los espacios de nombres de Docker.

**Restricciones de Docker-out-of-Docker (DooD)**:
Si despliegas el propio OpenClaw Gateway como contenedor Docker, este orquesta contenedores sandbox hermanos usando el socket Docker del host (DooD). Esto introduce una restricción específica de mapeo de rutas:

- **La configuración requiere rutas del host**: la configuración de `workspace` en `openclaw.json` DEBE contener la **ruta absoluta del host** (por ejemplo `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor Gateway. Cuando OpenClaw pide al demonio Docker que inicie un sandbox, el demonio evalúa las rutas respecto al espacio de nombres del sistema operativo del host, no del Gateway.
- **Paridad de puente de sistema de archivos (mapeo de volumen idéntico)**: el proceso nativo de OpenClaw Gateway también escribe archivos de heartbeat y puente en el directorio `workspace`. Como el Gateway evalúa exactamente la misma cadena (la ruta del host) dentro de su propio entorno en contenedor, el despliegue del Gateway DEBE incluir un mapeo de volumen idéntico que vincule nativamente el espacio de nombres del host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si mapeas rutas internamente sin paridad absoluta con el host, OpenClaw lanza nativamente un error de permisos `EACCES` al intentar escribir su heartbeat dentro del entorno del contenedor porque la cadena de ruta completamente calificada no existe de forma nativa.

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw ejecute en sandbox `exec`, herramientas de archivos y lecturas de archivos multimedia en
una máquina accesible por SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // O usa SecretRefs / contenido en línea en lugar de archivos locales:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Cómo funciona:

- OpenClaw crea una raíz remota por alcance bajo `sandbox.ssh.workspaceRoot`.
- En el primer uso después de crear o recrear, OpenClaw siembra ese espacio de trabajo remoto desde el espacio de trabajo local una vez.
- Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, lecturas de archivos multimedia del prompt y la preparación de archivos multimedia entrantes se ejecutan directamente sobre el espacio de trabajo remoto por SSH.
- OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al espacio de trabajo local.

Material de autenticación:

- `identityFile`, `certificateFile`, `knownHostsFile`: usa archivos locales existentes y los pasa mediante la configuración de OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usa cadenas en línea o SecretRefs. OpenClaw las resuelve mediante la instantánea normal del runtime de secretos, las escribe en archivos temporales con `0600` y las elimina cuando termina la sesión SSH.
- Si se configuran tanto `*File` como `*Data` para el mismo elemento, `*Data` tiene prioridad para esa sesión SSH.

Este es un modelo **remoto canónico**. El espacio de trabajo SSH remoto se convierte en el estado real del sandbox después de la siembra inicial.

Consecuencias importantes:

- Las ediciones locales en el host realizadas fuera de OpenClaw después del paso de siembra no son visibles remotamente hasta que recrees el sandbox.
- `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrarla desde local en el siguiente uso.
- El navegador en sandbox no es compatible con el backend SSH.
- La configuración `sandbox.docker.*` no se aplica al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw ejecute herramientas en sandbox dentro de un
entorno remoto gestionado por OpenShell. Para la guía completa de configuración, referencia
de configuración y comparación de modos de espacio de trabajo, consulta la página dedicada de
[OpenShell](/es/gateway/openshell).

OpenShell reutiliza el mismo transporte SSH básico y el mismo puente de sistema de archivos remoto que el
backend SSH genérico, y añade el ciclo de vida específico de OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) más el modo opcional de espacio de trabajo `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modos de OpenShell:

- `mirror` (predeterminado): el espacio de trabajo local sigue siendo canónico. OpenClaw sincroniza archivos locales con OpenShell antes de ejecutar y sincroniza el espacio de trabajo remoto de vuelta después de ejecutar.
- `remote`: el espacio de trabajo OpenShell es canónico después de crear el sandbox. OpenClaw siembra el espacio de trabajo remoto una vez desde el espacio local y luego las herramientas de archivos y exec se ejecutan directamente contra el sandbox remoto sin sincronizar los cambios de vuelta.

Detalles del transporte remoto:

- OpenClaw pide a OpenShell la configuración SSH específica del sandbox mediante `openshell sandbox ssh-config <name>`.
- El núcleo escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto usado por `backend: "ssh"`.
- Solo en modo `mirror` cambia el ciclo de vida: sincroniza de local a remoto antes de exec y luego sincroniza de vuelta después de exec.

Limitaciones actuales de OpenShell:

- el navegador sandbox aún no es compatible
- `sandbox.docker.binds` no es compatible en el backend OpenShell
- los ajustes de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend Docker

#### Modos de espacio de trabajo

OpenShell tiene dos modelos de espacio de trabajo. Esta es la parte que más importa en la práctica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **espacio de trabajo local siga siendo canónico**.

Comportamiento:

- Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox de OpenShell.
- Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
- Las herramientas de archivos siguen operando a través del puente sandbox, pero el espacio de trabajo local sigue siendo la fuente de verdad entre turnos.

Úsalo cuando:

- editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el sandbox
- quieres que el sandbox OpenShell se comporte lo más parecido posible al backend Docker
- quieres que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno exec

Desventaja:

- coste extra de sincronización antes y después de exec

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **espacio de trabajo OpenShell se vuelva canónico**.

Comportamiento:

- Cuando el sandbox se crea por primera vez, OpenClaw siembra el espacio de trabajo remoto desde el espacio de trabajo local una vez.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente sobre el espacio de trabajo remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local después de exec.
- Las lecturas de archivos multimedia en tiempo de prompt siguen funcionando porque las herramientas de archivos y multimedia leen a través del puente del sandbox en lugar de asumir una ruta local del host.
- El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

Consecuencias importantes:

- Si editas archivos en el host fuera de OpenClaw después del paso de siembra, el sandbox remoto **no** verá esos cambios automáticamente.
- Si el sandbox se recrea, el espacio de trabajo remoto vuelve a sembrarse desde el espacio de trabajo local.
- Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte con ese mismo alcance.

Úsalo cuando:

- el sandbox debe vivir principalmente en el lado remoto de OpenShell
- quieres menor sobrecarga de sincronización por turno
- no quieres que ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox

Elige `mirror` si piensas en el sandbox como un entorno temporal de ejecución.
Elige `remote` si piensas en el sandbox como el espacio de trabajo real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell siguen gestionándose mediante el ciclo de vida normal de sandbox:

- `openclaw sandbox list` muestra runtimes de OpenShell además de runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y permite que OpenClaw lo vuelva a crear en el siguiente uso
- la lógica de limpieza también tiene en cuenta el backend

Para el modo `remote`, recreate es especialmente importante:

- recreate elimina el espacio de trabajo remoto canónico para ese alcance
- el siguiente uso siembra un espacio de trabajo remoto nuevo desde el espacio de trabajo local

Para el modo `mirror`, recreate principalmente restablece el entorno remoto de ejecución
porque el espacio de trabajo local sigue siendo canónico de todos modos.

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver** el sandbox:

- `"none"` (predeterminado): las herramientas ven un espacio de trabajo sandbox bajo `~/.openclaw/sandboxes`.
- `"ro"`: monta el espacio de trabajo del agente como solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta el espacio de trabajo del agente en lectura/escritura en `/workspace`.

Con el backend OpenShell:

- el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos exec
- el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la siembra inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

Los archivos multimedia entrantes se copian al espacio de trabajo sandbox activo (`media/inbound/*`).
Nota sobre Skills: la herramienta `read` tiene raíz en el sandbox. Con `workspaceAccess: "none"`,
OpenClaw refleja las Skills elegibles en el espacio de trabajo sandbox (`.../skills`) para
que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde
`/workspace/skills`.

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host dentro del contenedor.
Formato: `host:container:mode` (por ejemplo `"/home/user/source:/source:rw"`).

Los montajes globales y por agente se **combinan** (no se reemplazan). En `scope: "shared"`, los montajes por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador sandbox**.

- Cuando está configurado (incluido `[]`), reemplaza `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador usa como respaldo `agents.defaults.sandbox.docker.binds` (compatible con versiones anteriores).

Ejemplo (código fuente de solo lectura + un directorio de datos extra):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Notas de seguridad:

- Los montajes bind omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que configures (`:ro` o `:rw`).
- OpenClaw bloquea orígenes de bind peligrosos (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que los expondrían).
- OpenClaw también bloquea raíces comunes de credenciales en el directorio personal como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de binds no se basa solo en coincidencia de cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve otra vez a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas.
- Eso significa que los escapes por enlaces simbólicos en directorios padre siguen fallando en modo cerrado incluso cuando la hoja final todavía no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonizan del mismo modo, así que una ruta que solo parece estar dentro de la lista de permitidos antes de resolver enlaces simbólicos sigue rechazándose como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos bind siguen siendo independientes.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y exec elevado.

## Imágenes + configuración

Imagen Docker predeterminada: `openclaw-sandbox:bookworm-slim`

Compílala una vez:

```bash
scripts/sandbox-setup.sh
```

Nota: la imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u
otros runtimes), crea una imagen personalizada o instala mediante
`sandbox.docker.setupCommand` (requiere salida de red + raíz escribible +
usuario root).

Si quieres una imagen de sandbox más funcional con herramientas comunes (por ejemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), compila:

```bash
scripts/sandbox-common-setup.sh
```

Luego configura `agents.defaults.sandbox.docker.image` como
`openclaw-sandbox-common:bookworm-slim`.

Imagen del navegador sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

De forma predeterminada, los contenedores Docker del sandbox se ejecutan **sin red**.
Sobrescríbelo con `agents.defaults.sandbox.docker.network`.

La imagen incluida del navegador sandbox también aplica valores predeterminados conservadores de inicio de Chromium
para cargas de trabajo en contenedor. Los valores actuales del contenedor incluyen:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox` cuando `noSandbox` está habilitado.
- Las tres flags de refuerzo gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y resultan útiles
  cuando los contenedores no tienen soporte GPU. Configura `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
- `--disable-extensions` está habilitado de forma predeterminada y puede deshabilitarse con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependan de extensiones.
- `--renderer-process-limit=2` se controla con
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

Si necesitas un perfil de runtime distinto, usa una imagen personalizada del navegador y proporciona
tu propio entrypoint. Para perfiles locales de Chromium (sin contenedor), usa
`browser.extraArgs` para añadir flags adicionales de inicio.

Valores predeterminados de seguridad:

- `network: "host"` está bloqueado.
- `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omitir el límite por unión de namespace).
- Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Las instalaciones de Docker y el gateway en contenedor están aquí:
[Docker](/es/install/docker)

Para despliegues del gateway con Docker, `scripts/docker/setup.sh` puede iniciar la configuración de sandbox.
Configura `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes
sobrescribir la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia
de variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor sandbox (no en cada ejecución).
Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Errores comunes:

- El valor predeterminado de `docker.network` es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
- `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para casos de emergencia.
- `readOnlyRoot: true` impide escribir; configura `readOnlyRoot: false` o crea una imagen personalizada.
- `user` debe ser root para instalar paquetes (omite `user` o configura `user: "0:0"`).
- Sandbox exec **no** hereda `process.env` del host. Usa
  `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves API de Skills.

## Política de herramientas + rutas de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes de las reglas de sandbox. Si una herramienta está denegada
globalmente o por agente, el sandboxing no la recupera.

`tools.elevated` es una ruta de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino exec es `node`).
Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para deshabilitar completamente
`exec`, usa una política de denegación de herramientas (consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo efectivo de sandbox, la política de herramientas y las claves de configuración para corregirlo.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de “¿por qué está bloqueado esto?”.
  Mantenlo restringido.

## Anulaciones de varios agentes

Cada agente puede sobrescribir sandbox + herramientas:
`agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox).
Consulta [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para la precedencia.

## Ejemplo mínimo para habilitar

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Documentación relacionada

- [OpenShell](/es/gateway/openshell) -- configuración del backend de sandbox gestionado, modos de espacio de trabajo y referencia de configuración
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de “¿por qué está bloqueado esto?”
- [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Security](/es/gateway/security)
