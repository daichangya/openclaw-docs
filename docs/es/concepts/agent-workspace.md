---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o su estructura de archivos
    - Quieres respaldar o migrar un espacio de trabajo de agente
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copia de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-04-25T13:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

El espacio de trabajo es el hogar del agente. Es el único directorio de trabajo usado para
las herramientas de archivos y para el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto está separado de `~/.openclaw/`, que almacena configuración, credenciales y
sesiones.

**Importante:** el espacio de trabajo es el **cwd predeterminado**, no un sandbox rígido. Las herramientas
resuelven rutas relativas respecto del espacio de trabajo, pero las rutas absolutas aún pueden llegar
a otras ubicaciones del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
[`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).
Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan
dentro de un espacio de trabajo de sandbox bajo `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.

## Ubicación predeterminada

- Predeterminada: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está configurado y no es `"default"`, el valor predeterminado pasa a ser
  `~/.openclaw/workspace-<profile>`.
- Sobrescríbelo en `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` o `openclaw setup` crearán el
espacio de trabajo y sembrarán los archivos bootstrap si faltan.
Las copias de sembrado del sandbox solo aceptan archivos normales dentro del espacio de trabajo; los
alias simbólicos/enlaces duros que se resuelven fuera del espacio de trabajo de origen se ignoran.

Si ya administras tú mismo los archivos del espacio de trabajo, puedes deshabilitar la creación
de archivos bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones antiguas pueden haber creado `~/openclaw`.
Mantener varios directorios de espacio de trabajo puede causar una deriva confusa de autenticación o estado,
porque solo un espacio de trabajo está activo a la vez.

**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las
carpetas adicionales, archívalas o muévelas a la Papelera (por ejemplo `trash ~/openclaw`).
Si intencionalmente mantienes varios espacios de trabajo, asegúrate de que
`agents.defaults.workspace` apunte al activo.

`openclaw doctor` avisa cuando detecta directorios adicionales de espacio de trabajo.

## Mapa de archivos del espacio de trabajo (qué significa cada archivo)

Estos son los archivos estándar que OpenClaw espera dentro del espacio de trabajo:

- `AGENTS.md`
  - Instrucciones operativas para el agente y cómo debe usar la memoria.
  - Se carga al inicio de cada sesión.
  - Buen lugar para reglas, prioridades y detalles de "cómo comportarse".

- `SOUL.md`
  - Personalidad, tono y límites.
  - Se carga en cada sesión.
  - Guía: [Guía de personalidad de SOUL.md](/es/concepts/soul)

- `USER.md`
  - Quién es el usuario y cómo dirigirse a él.
  - Se carga en cada sesión.

- `IDENTITY.md`
  - El nombre, estilo y emoji del agente.
  - Se crea/actualiza durante el ritual bootstrap.

- `TOOLS.md`
  - Notas sobre tus herramientas y convenciones locales.
  - No controla la disponibilidad de herramientas; es solo una guía.

- `HEARTBEAT.md`
  - Lista de comprobación pequeña opcional para ejecuciones de Heartbeat.
  - Mantenla breve para evitar gastar tokens.

- `BOOT.md`
  - Lista de comprobación opcional de inicio que se ejecuta automáticamente al reiniciar el gateway (cuando los [hooks internos](/es/automation/hooks) están habilitados).
  - Mantenla breve; usa la herramienta de mensajes para envíos salientes.

- `BOOTSTRAP.md`
  - Ritual único de primera ejecución.
  - Solo se crea para un espacio de trabajo completamente nuevo.
  - Elimínalo después de completar el ritual.

- `memory/YYYY-MM-DD.md`
  - Registro diario de memoria (un archivo por día).
  - Se recomienda leer el de hoy y el de ayer al iniciar la sesión.

- `MEMORY.md` (opcional)
  - Memoria de largo plazo curada.
  - Cárgala solo en la sesión principal y privada (no en contextos compartidos/de grupo).

Consulta [Memoria](/es/concepts/memory) para el flujo de trabajo y el vaciado automático de memoria.

- `skills/` (opcional)
  - Skills específicos del espacio de trabajo.
  - Ubicación de Skills de mayor precedencia para ese espacio de trabajo.
  - Sobrescribe Skills de agentes del proyecto, Skills de agentes personales, Skills administrados, Skills incluidos y `skills.load.extraDirs` cuando los nombres entran en conflicto.

- `canvas/` (opcional)
  - Archivos de la interfaz de usuario de Canvas para pantallas de Node (por ejemplo `canvas/index.html`).

Si falta algún archivo bootstrap, OpenClaw inyecta un marcador de "archivo faltante" en
la sesión y continúa. Los archivos bootstrap grandes se truncan al inyectarse;
ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000) y
`agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000).
`openclaw setup` puede recrear valores predeterminados faltantes sin sobrescribir archivos
existentes.

## Qué NO está en el espacio de trabajo

Estos elementos viven bajo `~/.openclaw/` y NO deben confirmarse en el repositorio del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación de modelos: OAuth + claves API)
- `~/.openclaw/credentials/` (estado de canales/proveedores más datos heredados de importación OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesiones + metadatos)
- `~/.openclaw/skills/` (Skills administrados)

Si necesitas migrar sesiones o configuración, cópialos por separado y mantenlos
fuera del control de versiones.

## Copia de seguridad con git (recomendado, privado)

Trata el espacio de trabajo como memoria privada. Ponlo en un repositorio git **privado** para que tenga
copia de seguridad y sea recuperable.

Ejecuta estos pasos en la máquina donde se ejecuta el Gateway (ahí es donde vive el
espacio de trabajo).

### 1) Inicializar el repositorio

Si git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este
espacio de trabajo aún no es un repositorio, ejecuta:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Agregar un remoto privado (opciones sencillas para principiantes)

Opción A: interfaz web de GitHub

1. Crea un nuevo repositorio **privado** en GitHub.
2. No lo inicialices con un README (evita conflictos de fusión).
3. Copia la URL remota HTTPS.
4. Agrega el remoto y haz push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opción B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opción C: interfaz web de GitLab

1. Crea un nuevo repositorio **privado** en GitLab.
2. No lo inicialices con un README (evita conflictos de fusión).
3. Copia la URL remota HTTPS.
4. Agrega el remoto y haz push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Actualizaciones continuas

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## No confirmes secretos

Incluso en un repositorio privado, evita almacenar secretos en el espacio de trabajo:

- Claves API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa bajo `~/.openclaw/`.
- Volcados sin procesar de chats o archivos adjuntos sensibles.

Si debes almacenar referencias sensibles, usa marcadores de posición y guarda el secreto real
en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).

Plantilla sugerida de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Mover el espacio de trabajo a una máquina nueva

1. Clona el repositorio en la ruta deseada (predeterminada: `~/.openclaw/workspace`).
2. Establece `agents.defaults.workspace` en esa ruta dentro de `~/.openclaw/openclaw.json`.
3. Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
4. Si necesitas las sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la
   máquina antigua por separado.

## Notas avanzadas

- El enrutamiento multiagente puede usar distintos espacios de trabajo por agente. Consulta
  [Enrutamiento de canales](/es/channels/channel-routing) para la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones que no son principales pueden usar espacios de trabajo
  de sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Órdenes permanentes](/es/automation/standing-orders) — instrucciones persistentes en archivos del espacio de trabajo
- [Heartbeat](/es/gateway/heartbeat) — archivo `HEARTBEAT.md` del espacio de trabajo
- [Sesión](/es/concepts/session) — rutas de almacenamiento de sesiones
- [Sandboxing](/es/gateway/sandboxing) — acceso al espacio de trabajo en entornos con sandbox
