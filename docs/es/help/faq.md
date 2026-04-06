---
read_when:
    - Responder preguntas comunes de soporte sobre configuración, instalación, onboarding o entorno de ejecución
    - Clasificar problemas reportados por usuarios antes de una depuración más profunda
summary: Preguntas frecuentes sobre la configuración, instalación y uso de OpenClaw
title: Preguntas frecuentes
x-i18n:
    generated_at: "2026-04-06T03:12:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d6d09621c6033d580cbcf1ff46f81587d69404d6f64c8d8fd8c3f09185bb920
    source_path: help/faq.md
    workflow: 15
---

# Preguntas frecuentes

Respuestas rápidas más depuración más profunda para configuraciones del mundo real (desarrollo local, VPS, múltiples agentes, OAuth/claves API, conmutación por error de modelos). Para diagnósticos del entorno de ejecución, consulta [Troubleshooting](/es/gateway/troubleshooting). Para la referencia completa de configuración, consulta [Configuration](/es/gateway/configuration).

## Primeros 60 segundos si algo está roto

1. **Estado rápido (primera comprobación)**

   ```bash
   openclaw status
   ```

   Resumen local rápido: SO + actualización, accesibilidad del gateway/servicio, agentes/sesiones, configuración del proveedor + problemas del entorno de ejecución (cuando el gateway es accesible).

2. **Informe apto para compartir (seguro de compartir)**

   ```bash
   openclaw status --all
   ```

   Diagnóstico de solo lectura con cola del registro (tokens redactados).

3. **Estado del daemon + puerto**

   ```bash
   openclaw gateway status
   ```

   Muestra el entorno de ejecución del supervisor frente a la accesibilidad RPC, la URL objetivo del sondeo y qué configuración probablemente usó el servicio.

4. **Sondeos profundos**

   ```bash
   openclaw status --deep
   ```

   Ejecuta un sondeo en vivo del estado del gateway, incluidos sondeos de canales cuando son compatibles
   (requiere un gateway accesible). Consulta [Health](/es/gateway/health).

5. **Seguir el último registro**

   ```bash
   openclaw logs --follow
   ```

   Si RPC está caído, recurre a:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Los registros de archivo están separados de los registros del servicio; consulta [Logging](/es/logging) y [Troubleshooting](/es/gateway/troubleshooting).

6. **Ejecutar doctor (reparaciones)**

   ```bash
   openclaw doctor
   ```

   Repara/migra configuración/estado + ejecuta comprobaciones de estado. Consulta [Doctor](/es/gateway/doctor).

7. **Instantánea del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # muestra la URL objetivo + la ruta de configuración en errores
   ```

   Solicita al gateway en ejecución una instantánea completa (solo WS). Consulta [Health](/es/gateway/health).

## Inicio rápido y configuración de primera ejecución

<AccordionGroup>
  <Accordion title="Estoy atascado, cuál es la forma más rápida de salir del problema">
    Usa un agente de IA local que pueda **ver tu máquina**. Eso es mucho más eficaz que preguntar
    en Discord, porque la mayoría de los casos de “estoy atascado” son **problemas de configuración o entorno local** que
    los ayudantes remotos no pueden inspeccionar.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Estas herramientas pueden leer el repositorio, ejecutar comandos, inspeccionar registros y ayudar a corregir la configuración
    de tu máquina (PATH, servicios, permisos, archivos de autenticación). Dales el **checkout completo del código fuente** mediante
    la instalación modificable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Esto instala OpenClaw **desde un checkout de git**, para que el agente pueda leer el código + la documentación y
    razonar sobre la versión exacta que estás ejecutando. Siempre puedes volver a estable
    ejecutando de nuevo el instalador sin `--install-method git`.

    Consejo: pídele al agente que **planifique y supervise** la corrección (paso a paso), y luego ejecute solo los
    comandos necesarios. Eso mantiene los cambios pequeños y más fáciles de auditar.

    Si descubres un error real o una corrección, por favor abre un issue de GitHub o envía un PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Empieza con estos comandos (comparte las salidas al pedir ayuda):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Qué hacen:

    - `openclaw status`: instantánea rápida del estado del gateway/agente + configuración básica.
    - `openclaw models status`: comprueba la autenticación del proveedor + disponibilidad de modelos.
    - `openclaw doctor`: valida y repara problemas comunes de configuración/estado.

    Otras comprobaciones útiles de CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Bucle rápido de depuración: [Primeros 60 segundos si algo está roto](#primeros-60-segundos-si-algo-está-roto).
    Documentación de instalación: [Install](/es/install), [Installer flags](/es/install/installer), [Updating](/es/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sigue omitiendo ejecuciones. Qué significan los motivos de omisión">
    Motivos comunes de omisión de heartbeat:

    - `quiet-hours`: fuera de la ventana configurada de horas activas
    - `empty-heartbeat-file`: `HEARTBEAT.md` existe, pero solo contiene estructura vacía o solo encabezados
    - `no-tasks-due`: el modo de tareas de `HEARTBEAT.md` está activo, pero ninguno de los intervalos de tarea aún vence
    - `alerts-disabled`: toda la visibilidad de heartbeat está desactivada (`showOk`, `showAlerts` y `useIndicator` están desactivados)

    En modo tarea, las marcas de tiempo de vencimiento solo avanzan después de que se completa
    una ejecución real de heartbeat. Las ejecuciones omitidas no marcan las tareas como completadas.

    Documentación: [Heartbeat](/es/gateway/heartbeat), [Automation & Tasks](/es/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar y configurar OpenClaw">
    El repositorio recomienda ejecutar desde el código fuente y usar el onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    El asistente también puede compilar automáticamente los recursos de la UI. Después del onboarding, normalmente ejecutas el Gateway en el puerto **18789**.

    Desde el código fuente (contribuidores/desarrollo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # instala automáticamente las dependencias de la UI en la primera ejecución
    openclaw onboard
    ```

    Si aún no tienes una instalación global, ejecútalo mediante `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Cómo abro el panel después del onboarding">
    El asistente abre tu navegador con una URL limpia del panel (sin token en la URL) justo después del onboarding y también imprime el enlace en el resumen. Mantén esa pestaña abierta; si no se lanzó, copia/pega la URL impresa en la misma máquina.
  </Accordion>

  <Accordion title="Cómo autentico el panel en localhost frente a remoto">
    **Localhost (misma máquina):**

    - Abre `http://127.0.0.1:18789/`.
    - Si pide autenticación con secreto compartido, pega el token o la contraseña configurados en la configuración de Control UI.
    - Origen del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origen de la contraseña: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Si todavía no hay un secreto compartido configurado, genera un token con `openclaw doctor --generate-gateway-token`.

    **Fuera de localhost:**

    - **Tailscale Serve** (recomendado): mantén bind en loopback, ejecuta `openclaw gateway --tailscale serve`, abre `https://<magicdns>/`. Si `gateway.auth.allowTailscale` es `true`, los encabezados de identidad satisfacen la autenticación de Control UI/WebSocket (sin pegar un secreto compartido, asume host del gateway de confianza); las API HTTP siguen requiriendo autenticación con secreto compartido, salvo que uses deliberadamente `none` en ingress privado o autenticación HTTP de `trusted-proxy`.
      Los intentos concurrentes fallidos de autenticación de Serve desde el mismo cliente se serializan antes de que el limitador de autenticación fallida los registre, por lo que el segundo reintento fallido ya puede mostrar `retry later`.
    - **Bind de tailnet**: ejecuta `openclaw gateway --bind tailnet --token "<token>"` (o configura autenticación por contraseña), abre `http://<tailscale-ip>:18789/`, y luego pega el secreto compartido correspondiente en la configuración del panel.
    - **Proxy inverso con reconocimiento de identidad**: mantén el Gateway detrás de un `trusted-proxy` no loopback, configura `gateway.auth.mode: "trusted-proxy"`, y luego abre la URL del proxy.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`. La autenticación con secreto compartido sigue aplicándose a través del túnel; pega el token o la contraseña configurados si se te solicita.

    Consulta [Dashboard](/web/dashboard) y [Web surfaces](/web) para detalles sobre modos de bind y autenticación.

  </Accordion>

  <Accordion title="Por qué hay dos configuraciones de aprobación exec para aprobaciones por chat">
    Controlan capas diferentes:

    - `approvals.exec`: reenvía solicitudes de aprobación a destinos de chat
    - `channels.<channel>.execApprovals`: hace que ese canal actúe como cliente nativo de aprobación para aprobaciones exec

    La política exec del host sigue siendo la puerta real de aprobación. La configuración del chat solo controla dónde aparecen
    las solicitudes de aprobación y cómo puede responder la gente.

    En la mayoría de las configuraciones **no** necesitas ambas:

    - Si el chat ya admite comandos y respuestas, `/approve` en el mismo chat funciona mediante la ruta compartida.
    - Si un canal nativo compatible puede inferir aprobadores de forma segura, OpenClaw ahora habilita automáticamente aprobaciones nativas con DM primero cuando `channels.<channel>.execApprovals.enabled` no está configurado o está en `"auto"`.
    - Cuando hay disponibles tarjetas/botones nativos de aprobación, esa UI nativa es la ruta principal; el agente solo debería incluir un comando manual `/approve` si el resultado de la herramienta dice que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta.
    - Usa `approvals.exec` solo cuando las solicitudes también deban reenviarse a otros chats o salas de operaciones explícitas.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo cuando quieras explícitamente que las solicitudes de aprobación se publiquen de vuelta en la sala/tema de origen.
    - Las aprobaciones de plugins son independientes: usan `/approve` en el mismo chat de forma predeterminada, `approvals.plugin` opcional para reenvío y solo algunos canales nativos mantienen manejo nativo de aprobación de plugin por encima.

    Versión corta: el reenvío es para enrutamiento, la configuración del cliente nativo es para una UX más rica y específica del canal.
    Consulta [Exec Approvals](/es/tools/exec-approvals).

  </Accordion>

  <Accordion title="Qué entorno de ejecución necesito">
    Se requiere Node **>= 22**. Se recomienda `pnpm`. Bun **no está recomendado** para el Gateway.
  </Accordion>

  <Accordion title="Funciona en Raspberry Pi">
    Sí. El Gateway es ligero: la documentación indica que **512 MB-1 GB de RAM**, **1 núcleo** y unos **500 MB**
    de disco son suficientes para uso personal, y señala que un **Raspberry Pi 4 puede ejecutarlo**.

    Si quieres más margen (registros, multimedia, otros servicios), se recomiendan **2 GB**,
    pero no es un mínimo estricto.

    Consejo: un Pi/VPS pequeño puede alojar el Gateway, y puedes emparejar **nodes** en tu portátil/teléfono para
    pantalla/cámara/canvas local o ejecución de comandos. Consulta [Nodes](/es/nodes).

  </Accordion>

  <Accordion title="Algún consejo para instalaciones en Raspberry Pi">
    Versión corta: funciona, pero espera algunas asperezas.

    - Usa un SO de **64 bits** y mantén Node >= 22.
    - Prefiere la **instalación modificable (git)** para poder ver registros y actualizar rápidamente.
    - Empieza sin canales/Skills y luego añádelos uno a uno.
    - Si te encuentras con problemas binarios extraños, normalmente es un problema de **compatibilidad ARM**.

    Documentación: [Linux](/es/platforms/linux), [Install](/es/install).

  </Accordion>

  <Accordion title="Se queda atascado en wake up my friend / el onboarding no termina. Qué hago">
    Esa pantalla depende de que el Gateway sea accesible y esté autenticado. La TUI también envía
    “Wake up, my friend!” automáticamente en el primer inicio. Si ves esa línea sin **ninguna respuesta**
    y los tokens se quedan en 0, el agente nunca se ejecutó.

    1. Reinicia el Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Comprueba estado + autenticación:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si sigue colgado, ejecuta:

    ```bash
    openclaw doctor
    ```

    Si el Gateway es remoto, asegúrate de que la conexión del túnel/Tailscale esté activa y de que la UI
    esté apuntando al Gateway correcto. Consulta [Remote access](/es/gateway/remote).

  </Accordion>

  <Accordion title="Puedo migrar mi configuración a una máquina nueva (Mac mini) sin rehacer el onboarding">
    Sí. Copia el **directorio de estado** y el **workspace**, luego ejecuta Doctor una vez. Esto
    mantiene tu bot “exactamente igual” (memoria, historial de sesión, autenticación y
    estado del canal) siempre que copies **ambas** ubicaciones:

    1. Instala OpenClaw en la nueva máquina.
    2. Copia `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`) desde la máquina antigua.
    3. Copia tu workspace (predeterminado: `~/.openclaw/workspace`).
    4. Ejecuta `openclaw doctor` y reinicia el servicio Gateway.

    Eso conserva configuración, perfiles de autenticación, credenciales de WhatsApp, sesiones y memoria. Si estás en
    modo remoto, recuerda que el host del gateway posee el almacén de sesiones y el workspace.

    **Importante:** si solo haces commit/push de tu workspace a GitHub, estás respaldando
    **memoria + archivos de arranque**, pero **no** el historial de sesiones ni la autenticación. Eso vive
    en `~/.openclaw/` (por ejemplo `~/.openclaw/agents/<agentId>/sessions/`).

    Relacionado: [Migrating](/es/install/migrating), [Dónde se almacenan las cosas en disco](#dónde-se-almacenan-las-cosas-en-disco),
    [Agent workspace](/es/concepts/agent-workspace), [Doctor](/es/gateway/doctor),
    [Remote mode](/es/gateway/remote).

  </Accordion>

  <Accordion title="Dónde veo qué hay de nuevo en la última versión">
    Consulta el changelog de GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Las entradas más recientes están arriba. Si la sección superior está marcada como **Unreleased**, la siguiente sección
    con fecha es la última versión publicada. Las entradas se agrupan en **Highlights**, **Changes** y
    **Fixes** (más secciones de documentación/otras cuando haga falta).

  </Accordion>

  <Accordion title="No puedo acceder a docs.openclaw.ai (error SSL)">
    Algunas conexiones de Comcast/Xfinity bloquean incorrectamente `docs.openclaw.ai` mediante Xfinity
    Advanced Security. Desactívalo o añade `docs.openclaw.ai` a la lista de permitidos y vuelve a intentarlo.
    Ayúdanos a desbloquearlo informándolo aquí: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si sigues sin poder acceder al sitio, la documentación está replicada en GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferencia entre estable y beta">
    **Stable** y **beta** son **dist-tags de npm**, no líneas de código separadas:

    - `latest` = estable
    - `beta` = compilación temprana para pruebas

    Normalmente, una versión estable llega primero a **beta**, y luego un paso de
    promoción explícito mueve esa misma versión a `latest`. Los mantenedores también pueden
    publicar directamente en `latest` cuando sea necesario. Por eso beta y estable pueden
    apuntar a la **misma versión** después de la promoción.

    Consulta qué cambió:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Para los one-liners de instalación y la diferencia entre beta y dev, consulta el acordeón de abajo.

  </Accordion>

  <Accordion title="Cómo instalo la versión beta y cuál es la diferencia entre beta y dev">
    **Beta** es el dist-tag de npm `beta` (puede coincidir con `latest` después de la promoción).
    **Dev** es la cabecera móvil de `main` (git); cuando se publica, usa el dist-tag de npm `dev`.

    One-liners (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador para Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Más detalle: [Development channels](/es/install/development-channels) y [Installer flags](/es/install/installer).

  </Accordion>

  <Accordion title="Cómo pruebo lo último">
    Dos opciones:

    1. **Canal dev (checkout de git):**

    ```bash
    openclaw update --channel dev
    ```

    Esto cambia a la rama `main` y actualiza desde el código fuente.

    2. **Instalación modificable (desde el sitio del instalador):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Eso te da un repositorio local que puedes editar y luego actualizar mediante git.

    Si prefieres un clone limpio manual, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentación: [Update](/cli/update), [Development channels](/es/install/development-channels),
    [Install](/es/install).

  </Accordion>

  <Accordion title="Cuánto suelen tardar la instalación y el onboarding">
    Guía aproximada:

    - **Instalación:** 2-5 minutos
    - **Onboarding:** 5-15 minutos según cuántos canales/modelos configures

    Si se cuelga, usa [Instalador atascado](#inicio-rápido-y-configuración-de-primera-ejecución)
    y el bucle rápido de depuración en [Estoy atascado](#inicio-rápido-y-configuración-de-primera-ejecución).

  </Accordion>

  <Accordion title="Instalador atascado Cómo obtengo más información">
    Vuelve a ejecutar el instalador con **salida detallada**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Instalación beta con salida detallada:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Para una instalación modificable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente en Windows (PowerShell):

    ```powershell
    # install.ps1 aún no tiene una marca -Verbose dedicada.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Más opciones: [Installer flags](/es/install/installer).

  </Accordion>

  <Accordion title="La instalación en Windows dice git not found o openclaw not recognized">
    Dos problemas comunes en Windows:

    **1) error de npm spawn git / git not found**

    - Instala **Git for Windows** y asegúrate de que `git` esté en tu PATH.
    - Cierra y vuelve a abrir PowerShell, luego vuelve a ejecutar el instalador.

    **2) openclaw is not recognized después de instalar**

    - Tu carpeta bin global de npm no está en PATH.
    - Comprueba la ruta:

      ```powershell
      npm config get prefix
      ```

    - Añade ese directorio a tu PATH de usuario (no hace falta el sufijo `\bin` en Windows; en la mayoría de sistemas es `%AppData%\npm`).
    - Cierra y vuelve a abrir PowerShell después de actualizar PATH.

    Si quieres la configuración de Windows más fluida, usa **WSL2** en lugar de Windows nativo.
    Documentación: [Windows](/es/platforms/windows).

  </Accordion>

  <Accordion title="La salida exec de Windows muestra texto chino dañado. Qué debo hacer">
    Normalmente esto es un desajuste de página de códigos de consola en shells nativas de Windows.

    Síntomas:

    - la salida de `system.run`/`exec` muestra chino como texto ilegible
    - el mismo comando se ve bien en otro perfil de terminal

    Solución rápida en PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Luego reinicia el Gateway y vuelve a probar tu comando:

    ```powershell
    openclaw gateway restart
    ```

    Si sigues reproduciendo esto en la última versión de OpenClaw, haz seguimiento/informa en:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentación no respondió mi pregunta. Cómo obtengo una mejor respuesta">
    Usa la **instalación modificable (git)** para tener el código fuente completo y la documentación localmente, y luego pregunta
    a tu bot (o Claude/Codex) _desde esa carpeta_ para que pueda leer el repositorio y responder con precisión.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Más detalle: [Install](/es/install) y [Installer flags](/es/install/installer).

  </Accordion>

  <Accordion title="Cómo instalo OpenClaw en Linux">
    Respuesta corta: sigue la guía de Linux y luego ejecuta el onboarding.

    - Ruta rápida de Linux + instalación del servicio: [Linux](/es/platforms/linux).
    - Guía completa: [Getting Started](/es/start/getting-started).
    - Instalador + actualizaciones: [Install & updates](/es/install/updating).

  </Accordion>

  <Accordion title="Cómo instalo OpenClaw en un VPS">
    Cualquier VPS Linux funciona. Instala en el servidor y luego usa SSH/Tailscale para llegar al Gateway.

    Guías: [exe.dev](/es/install/exe-dev), [Hetzner](/es/install/hetzner), [Fly.io](/es/install/fly).
    Acceso remoto: [Gateway remote](/es/gateway/remote).

  </Accordion>

  <Accordion title="Dónde están las guías de instalación en la nube/VPS">
    Mantenemos un **centro de alojamiento** con los proveedores más comunes. Elige uno y sigue la guía:

    - [VPS hosting](/es/vps) (todos los proveedores en un solo lugar)
    - [Fly.io](/es/install/fly)
    - [Hetzner](/es/install/hetzner)
    - [exe.dev](/es/install/exe-dev)

    Cómo funciona en la nube: el **Gateway se ejecuta en el servidor**, y accedes a él
    desde tu portátil/teléfono mediante Control UI (o Tailscale/SSH). Tu estado + workspace
    viven en el servidor, así que trata el host como la fuente de verdad y haz copias de seguridad.

    Puedes emparejar **nodes** (Mac/iOS/Android/headless) con ese Gateway en la nube para acceder a
    pantalla/cámara/canvas locales o ejecutar comandos en tu portátil mientras mantienes el
    Gateway en la nube.

    Centro: [Platforms](/es/platforms). Acceso remoto: [Gateway remote](/es/gateway/remote).
    Nodes: [Nodes](/es/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puedo pedirle a OpenClaw que se actualice a sí mismo">
    Respuesta corta: **es posible, pero no recomendable**. El flujo de actualización puede reiniciar el
    Gateway (lo que interrumpe la sesión activa), puede necesitar un checkout limpio de git y
    puede pedir confirmación. Más seguro: ejecutar las actualizaciones desde un shell como operador.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si debes automatizarlo desde un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentación: [Update](/cli/update), [Updating](/es/install/updating).

  </Accordion>

  <Accordion title="Qué hace realmente el onboarding">
    `openclaw onboard` es la ruta de configuración recomendada. En **modo local** te guía por:

    - **Configuración de modelo/autenticación** (OAuth del proveedor, claves API, setup-token heredado de Anthropic, además de opciones de modelo local como LM Studio)
    - Ubicación del **workspace** + archivos de arranque
    - **Configuración del Gateway** (bind/puerto/autenticación/tailscale)
    - **Canales** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, además de plugins de canal incluidos como QQ Bot)
    - **Instalación del daemon** (LaunchAgent en macOS; unidad de usuario systemd en Linux/WSL2)
    - **Comprobaciones de estado** y selección de **Skills**

    También avisa si tu modelo configurado es desconocido o si falta autenticación.

  </Accordion>

  <Accordion title="Necesito una suscripción a Claude o OpenAI para ejecutar esto">
    No. Puedes ejecutar OpenClaw con **claves API** (Anthropic/OpenAI/otros) o con
    **modelos solo locales** para que tus datos permanezcan en tu dispositivo. Las suscripciones (Claude
    Pro/Max u OpenAI Codex) son formas opcionales de autenticar esos proveedores.

    Para Anthropic en OpenClaw, la división práctica es:

    - **Clave API de Anthropic**: facturación normal de la API de Anthropic
    - **Autenticación por suscripción de Claude en OpenClaw**: Anthropic informó a los usuarios de OpenClaw el
      **4 de abril de 2026 a las 12:00 PM PT / 8:00 PM BST** que esto requiere
      **Extra Usage** facturado aparte de la suscripción

    Nuestras reproducciones locales también muestran que `claude -p --append-system-prompt ...` puede
    alcanzar la misma restricción de Extra Usage cuando el prompt añadido identifica
    OpenClaw, mientras que la misma cadena de prompt **no** reproduce ese bloqueo en
    la ruta Anthropic SDK + clave API. OpenAI Codex OAuth es explícitamente
    compatible con herramientas externas como OpenClaw.

    OpenClaw también admite otras opciones alojadas de estilo suscripción, entre ellas
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** y
    **Z.AI / GLM Coding Plan**.

    Documentación: [Anthropic](/es/providers/anthropic), [OpenAI](/es/providers/openai),
    [Qwen Cloud](/es/providers/qwen),
    [MiniMax](/es/providers/minimax), [GLM Models](/es/providers/glm),
    [Local models](/es/gateway/local-models), [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="Puedo usar la suscripción Claude Max sin una clave API">
    Sí, pero trátala como **autenticación por suscripción de Claude con Extra Usage**.

    Las suscripciones Claude Pro/Max no incluyen una clave API. En OpenClaw, eso
    significa que se aplica el aviso de facturación específico de Anthropic para OpenClaw:
    el tráfico por suscripción requiere **Extra Usage**. Si quieres tráfico de Anthropic sin
    esa ruta de Extra Usage, usa una clave API de Anthropic en su lugar.

  </Accordion>

  <Accordion title="Admiten autenticación por suscripción de Claude (Claude Pro o Max)">
    Sí, pero la interpretación compatible ahora es:

    - Anthropic en OpenClaw con una suscripción significa **Extra Usage**
    - Anthropic en OpenClaw sin esa ruta significa **clave API**

    El setup-token de Anthropic sigue disponible como ruta heredada/manual de OpenClaw,
    y el aviso de facturación específico de OpenClaw de Anthropic sigue aplicándose ahí. También
    reproducimos localmente la misma restricción de facturación con el uso directo de
    `claude -p --append-system-prompt ...` cuando el prompt añadido
    identifica OpenClaw, mientras que la misma cadena de prompt **no** se reprodujo en
    la ruta Anthropic SDK + clave API.

    Para cargas de trabajo de producción o multiusuario, la autenticación con clave API de Anthropic es la
    opción recomendada y más segura. Si quieres otras opciones alojadas de estilo suscripción
    en OpenClaw, consulta [OpenAI](/es/providers/openai), [Qwen / Model
    Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y
    [GLM Models](/es/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Por qué veo HTTP 429 rate_limit_error de Anthropic">
Eso significa que tu **cuota/límite de tasa de Anthropic** está agotado para la ventana actual. Si
usas **Claude CLI**, espera a que la ventana se restablezca o mejora tu plan. Si
usas una **clave API de Anthropic**, consulta la consola de Anthropic
para ver uso/facturación y aumenta los límites si es necesario.

    Si el mensaje es específicamente:
    `Extra usage is required for long context requests`, la solicitud intenta usar
    la beta de contexto de 1M de Anthropic (`context1m: true`). Eso solo funciona cuando tu
    credencial es apta para facturación de contexto largo (facturación por clave API o la
    ruta de inicio de sesión de Claude en OpenClaw con Extra Usage habilitado).

    Consejo: configura un **modelo de respaldo** para que OpenClaw pueda seguir respondiendo mientras un proveedor tiene límite de tasa.
    Consulta [Models](/cli/models), [OAuth](/es/concepts/oauth) y
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/es/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Es compatible AWS Bedrock">
    Sí. OpenClaw tiene un proveedor incluido de **Amazon Bedrock (Converse)**. Con marcadores de entorno de AWS presentes, OpenClaw puede descubrir automáticamente el catálogo Bedrock de streaming/texto y fusionarlo como proveedor implícito `amazon-bedrock`; en caso contrario, puedes habilitar explícitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o añadir una entrada manual de proveedor. Consulta [Amazon Bedrock](/es/providers/bedrock) y [Model providers](/es/providers/models). Si prefieres un flujo gestionado con clave, un proxy compatible con OpenAI delante de Bedrock sigue siendo una opción válida.
  </Accordion>

  <Accordion title="Cómo funciona la autenticación de Codex">
    OpenClaw admite **OpenAI Code (Codex)** mediante OAuth (inicio de sesión con ChatGPT). El onboarding puede ejecutar el flujo OAuth y establecerá el modelo predeterminado en `openai-codex/gpt-5.4` cuando corresponda. Consulta [Model providers](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).
  </Accordion>

  <Accordion title="Admiten autenticación por suscripción de OpenAI (Codex OAuth)">
    Sí. OpenClaw admite por completo **OAuth por suscripción de OpenAI Code (Codex)**.
    OpenAI permite explícitamente el uso de OAuth por suscripción en herramientas/flujos externos
    como OpenClaw. El onboarding puede ejecutar el flujo OAuth por ti.

    Consulta [OAuth](/es/concepts/oauth), [Model providers](/es/concepts/model-providers) y [Onboarding (CLI)](/es/start/wizard).

  </Accordion>

  <Accordion title="Cómo configuro Gemini CLI OAuth">
    Gemini CLI usa un **flujo de autenticación de plugin**, no un client id o secret en `openclaw.json`.

    Usa el proveedor Gemini API en su lugar:

    1. Habilita el plugin: `openclaw plugins enable google`
    2. Ejecuta `openclaw onboard --auth-choice gemini-api-key`
    3. Configura un modelo de Google como `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Es aceptable un modelo local para chats casuales">
    Normalmente no. OpenClaw necesita contexto amplio + seguridad sólida; las tarjetas pequeñas truncan y filtran. Si debes hacerlo, ejecuta localmente la **compilación del modelo más grande** que puedas (LM Studio) y consulta [/gateway/local-models](/es/gateway/local-models). Los modelos más pequeños/cuantiﬁcados aumentan el riesgo de prompt injection; consulta [Security](/es/gateway/security).
  </Accordion>

  <Accordion title="Cómo mantengo el tráfico del modelo alojado en una región específica">
    Elige endpoints fijados por región. OpenRouter expone opciones alojadas en EE. UU. para MiniMax, Kimi y GLM; elige la variante alojada en EE. UU. para mantener los datos en la región. Aun así puedes listar Anthropic/OpenAI junto a estos usando `models.mode: "merge"` para que los respaldos sigan disponibles mientras respetas el proveedor regional que selecciones.
  </Accordion>

  <Accordion title="Tengo que comprar un Mac Mini para instalar esto">
    No. OpenClaw se ejecuta en macOS o Linux (Windows mediante WSL2). Un Mac mini es opcional; algunas personas
    compran uno como host siempre activo, pero también sirve un VPS pequeño, servidor doméstico o equipo de clase Raspberry Pi.

    Solo necesitas un Mac para **herramientas exclusivas de macOS**. Para iMessage, usa [BlueBubbles](/es/channels/bluebubbles) (recomendado); el servidor BlueBubbles se ejecuta en cualquier Mac, y el Gateway puede ejecutarse en Linux o en otro sitio. Si quieres otras herramientas exclusivas de macOS, ejecuta el Gateway en un Mac o empareja un node de macOS.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes), [Mac remote mode](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Necesito un Mac mini para compatibilidad con iMessage">
    Necesitas **algún dispositivo macOS** con sesión iniciada en Messages. **No** tiene que ser un Mac mini;
    sirve cualquier Mac. **Usa [BlueBubbles](/es/channels/bluebubbles)** (recomendado) para iMessage; el servidor BlueBubbles se ejecuta en macOS, mientras que el Gateway puede ejecutarse en Linux o en otro lugar.

    Configuraciones habituales:

    - Ejecuta el Gateway en Linux/VPS y el servidor BlueBubbles en cualquier Mac con sesión iniciada en Messages.
    - Ejecuta todo en el Mac si quieres la configuración de una sola máquina más sencilla.

    Documentación: [BlueBubbles](/es/channels/bluebubbles), [Nodes](/es/nodes),
    [Mac remote mode](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si compro un Mac mini para ejecutar OpenClaw, puedo conectarlo a mi MacBook Pro">
    Sí. El **Mac mini puede ejecutar el Gateway**, y tu MacBook Pro puede conectarse como
    **node** (dispositivo complementario). Los nodes no ejecutan el Gateway; proporcionan
    capacidades extra como pantalla/cámara/canvas y `system.run` en ese dispositivo.

    Patrón habitual:

    - Gateway en el Mac mini (siempre activo).
    - El MacBook Pro ejecuta la app de macOS o un host de node y se empareja con el Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` para verlo.

    Documentación: [Nodes](/es/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puedo usar Bun">
    Bun **no está recomendado**. Vemos errores en tiempo de ejecución, especialmente con WhatsApp y Telegram.
    Usa **Node** para gateways estables.

    Si aun así quieres experimentar con Bun, hazlo en un gateway no productivo
    sin WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: qué va en allowFrom">
    `channels.telegram.allowFrom` es **el ID de usuario de Telegram del remitente humano** (numérico). No es el nombre de usuario del bot.

    El onboarding acepta una entrada `@username` y la resuelve a un ID numérico, pero la autorización de OpenClaw usa solo IDs numéricos.

    Más seguro (sin bot de terceros):

    - Envía un MD a tu bot y luego ejecuta `openclaw logs --follow` y lee `from.id`.

    API oficial de Bot:

    - Envía un MD a tu bot y luego llama a `https://api.telegram.org/bot<bot_token>/getUpdates` y lee `message.from.id`.

    Terceros (menos privado):

    - Envía un MD a `@userinfobot` o `@getidsbot`.

    Consulta [/channels/telegram](/es/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Pueden varias personas usar un número de WhatsApp con distintas instancias de OpenClaw">
    Sí, mediante **enrutamiento multiagente**. Asocia el **MD** de WhatsApp de cada remitente (par `kind: "direct"`, remitente E.164 como `+15551234567`) a un `agentId` diferente, para que cada persona tenga su propio workspace y almacén de sesiones. Las respuestas seguirán saliendo de la **misma cuenta de WhatsApp**, y el control de acceso para MD (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) es global por cuenta de WhatsApp. Consulta [Multi-Agent Routing](/es/concepts/multi-agent) y [WhatsApp](/es/channels/whatsapp).
  </Accordion>

  <Accordion title='Puedo tener un agente de "chat rápido" y otro "Opus para programación"'>
    Sí. Usa enrutamiento multiagente: da a cada agente su propio modelo predeterminado y luego asocia rutas entrantes (cuenta del proveedor o pares específicos) a cada agente. Hay una configuración de ejemplo en [Multi-Agent Routing](/es/concepts/multi-agent). Consulta también [Models](/es/concepts/models) y [Configuration](/es/gateway/configuration).
  </Accordion>

  <Accordion title="Funciona Homebrew en Linux">
    Sí. Homebrew es compatible con Linux (Linuxbrew). Configuración rápida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si ejecutas OpenClaw mediante systemd, asegúrate de que el PATH del servicio incluya `/home/linuxbrew/.linuxbrew/bin` (o tu prefijo de brew) para que las herramientas instaladas con `brew` se resuelvan en shells no interactivos.
    Las compilaciones recientes también anteponen directorios bin de usuario comunes en servicios Linux systemd (por ejemplo `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) y respetan `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` y `FNM_DIR` cuando están configurados.

  </Accordion>

  <Accordion title="Diferencia entre la instalación git modificable y npm install">
    - **Instalación modificable (git):** checkout completo del código fuente, editable, mejor para contribuidores.
      Compilas localmente y puedes parchear código/documentación.
    - **npm install:** instalación global de CLI, sin repositorio, mejor para “simplemente ejecutarlo”.
      Las actualizaciones vienen de los dist-tags de npm.

    Documentación: [Getting started](/es/start/getting-started), [Updating](/es/install/updating).

  </Accordion>

  <Accordion title="Puedo cambiar más tarde entre instalaciones npm y git">
    Sí. Instala la otra variante y luego ejecuta Doctor para que el servicio del gateway apunte al nuevo punto de entrada.
    Esto **no elimina tus datos**; solo cambia la instalación del código de OpenClaw. Tu estado
    (`~/.openclaw`) y workspace (`~/.openclaw/workspace`) permanecen intactos.

    De npm a git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    De git a npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor detecta una discrepancia en el punto de entrada del servicio del gateway y ofrece reescribir la configuración del servicio para que coincida con la instalación actual (usa `--repair` en automatización).

    Consejos de copia de seguridad: consulta [Estrategia de copia de seguridad](#dónde-se-almacenan-las-cosas-en-disco).

  </Accordion>

  <Accordion title="Debo ejecutar el Gateway en mi portátil o en un VPS">
    Respuesta corta: **si quieres fiabilidad 24/7, usa un VPS**. Si quieres la
    menor fricción y te valen suspensiones/reinicios, ejecútalo localmente.

    **Portátil (Gateway local)**

    - **Ventajas:** sin coste de servidor, acceso directo a archivos locales, ventana visible del navegador.
    - **Desventajas:** suspensión/cortes de red = desconexiones, actualizaciones/reinicios del SO interrumpen, debe permanecer despierto.

    **VPS / nube**

    - **Ventajas:** siempre activo, red estable, sin problemas por suspensión del portátil, más fácil de mantener en marcha.
    - **Desventajas:** a menudo se ejecuta sin interfaz (usa capturas), acceso solo remoto a archivos, debes usar SSH para actualizaciones.

    **Nota específica de OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funcionan bien desde un VPS. La única compensación real es **navegador headless** frente a una ventana visible. Consulta [Browser](/es/tools/browser).

    **Predeterminado recomendado:** VPS si ya has tenido desconexiones del gateway antes. Local es excelente cuando estás usando activamente el Mac y quieres acceso local a archivos o automatización de UI con navegador visible.

  </Accordion>

  <Accordion title="Qué tan importante es ejecutar OpenClaw en una máquina dedicada">
    No es obligatorio, pero **sí recomendable para fiabilidad y aislamiento**.

    - **Host dedicado (VPS/Mac mini/Pi):** siempre activo, menos interrupciones por suspensión/reinicio, permisos más limpios, más fácil de mantener en marcha.
    - **Portátil/escritorio compartido:** totalmente válido para pruebas y uso activo, pero espera pausas cuando la máquina suspenda o se actualice.

    Si quieres lo mejor de ambos mundos, mantén el Gateway en un host dedicado y empareja tu portátil como **node** para herramientas locales de pantalla/cámara/exec. Consulta [Nodes](/es/nodes).
    Para orientación de seguridad, lee [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="Cuáles son los requisitos mínimos de VPS y el SO recomendado">
    OpenClaw es ligero. Para un Gateway básico + un canal de chat:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB de RAM o más para margen (registros, multimedia, varios canales). Las herramientas de node y la automatización de navegador pueden consumir muchos recursos.

    SO: usa **Ubuntu LTS** (o cualquier Debian/Ubuntu moderno). Esa ruta de instalación en Linux es la más probada.

    Documentación: [Linux](/es/platforms/linux), [VPS hosting](/es/vps).

  </Accordion>

  <Accordion title="Puedo ejecutar OpenClaw en una VM y cuáles son los requisitos">
    Sí. Trata una VM igual que un VPS: debe estar siempre activa, ser accesible y tener
    suficiente RAM para el Gateway y cualquier canal que habilites.

    Orientación base:

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB de RAM o más si ejecutas varios canales, automatización de navegador o herramientas multimedia.
    - **SO:** Ubuntu LTS u otro Debian/Ubuntu moderno.

    Si estás en Windows, **WSL2 es la configuración estilo VM más fácil** y la que tiene mejor
    compatibilidad de herramientas. Consulta [Windows](/es/platforms/windows), [VPS hosting](/es/vps).
    Si estás ejecutando macOS en una VM, consulta [macOS VM](/es/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Qué es OpenClaw

<AccordionGroup>
  <Accordion title="Qué es OpenClaw, en un párrafo">
    OpenClaw es un asistente personal de IA que ejecutas en tus propios dispositivos. Responde en las superficies de mensajería que ya usas (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat y plugins de canal incluidos como QQ Bot) y también puede hacer voz + Canvas en vivo en plataformas compatibles. El **Gateway** es el plano de control siempre activo; el asistente es el producto.
  </Accordion>

  <Accordion title="Propuesta de valor">
    OpenClaw no es “solo un wrapper de Claude”. Es un **plano de control local-first** que te permite ejecutar un
    asistente capaz en **tu propio hardware**, accesible desde las aplicaciones de chat que ya usas, con
    sesiones con estado, memoria y herramientas, sin ceder el control de tus flujos de trabajo a un
    SaaS alojado.

    Puntos destacados:

    - **Tus dispositivos, tus datos:** ejecuta el Gateway donde quieras (Mac, Linux, VPS) y mantén el
      workspace + historial de sesiones en local.
    - **Canales reales, no una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      además de voz móvil y Canvas en plataformas compatibles.
    - **Independiente del modelo:** usa Anthropic, OpenAI, MiniMax, OpenRouter, etc., con enrutamiento
      por agente y conmutación por error.
    - **Opción solo local:** ejecuta modelos locales para que **todos los datos puedan permanecer en tu dispositivo** si quieres.
    - **Enrutamiento multiagente:** agentes separados por canal, cuenta o tarea, cada uno con su propio
      workspace y valores predeterminados.
    - **Código abierto y modificable:** inspecciona, amplía y autoaloja sin dependencia del proveedor.

    Documentación: [Gateway](/es/gateway), [Channels](/es/channels), [Multi-agent](/es/concepts/multi-agent),
    [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Acabo de configurarlo. Qué debería hacer primero">
    Buenos primeros proyectos:

    - Crear un sitio web (WordPress, Shopify o un sitio estático sencillo).
    - Prototipar una app móvil (esquema, pantallas, plan de API).
    - Organizar archivos y carpetas (limpieza, nombres, etiquetas).
    - Conectar Gmail y automatizar resúmenes o seguimientos.

    Puede manejar tareas grandes, pero funciona mejor cuando las divides en fases y
    usas subagentes para trabajo en paralelo.

  </Accordion>

  <Accordion title="Cuáles son los cinco casos de uso cotidianos principales de OpenClaw">
    Las victorias cotidianas suelen ser:

    - **Informes personales:** resúmenes de la bandeja de entrada, calendario y noticias que te importan.
    - **Investigación y redacción:** investigación rápida, resúmenes y primeros borradores de correos o documentos.
    - **Recordatorios y seguimientos:** avisos y listas de verificación impulsados por cron o heartbeat.
    - **Automatización del navegador:** rellenar formularios, recopilar datos y repetir tareas web.
    - **Coordinación entre dispositivos:** envía una tarea desde tu teléfono, deja que el Gateway la ejecute en un servidor y recibe el resultado de vuelta en el chat.

  </Accordion>

  <Accordion title="Puede OpenClaw ayudar con generación de leads, outreach, anuncios y blogs para un SaaS">
    Sí, para **investigación, cualificación y redacción**. Puede escanear sitios, crear listas cortas,
    resumir prospectos y redactar borradores de outreach o copy de anuncios.

    Para **outreach o campañas publicitarias**, mantén a una persona en el circuito. Evita el spam, sigue las leyes locales y
    las políticas de la plataforma, y revisa todo antes de enviarlo. El patrón más seguro es dejar que
    OpenClaw redacte y que tú apruebes.

    Documentación: [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="Cuáles son las ventajas frente a Claude Code para desarrollo web">
    OpenClaw es un **asistente personal** y una capa de coordinación, no un sustituto del IDE. Usa
    Claude Code o Codex para el bucle de programación directa más rápido dentro de un repositorio. Usa OpenClaw cuando
    quieras memoria duradera, acceso entre dispositivos y orquestación de herramientas.

    Ventajas:

    - **Memoria persistente + workspace** entre sesiones
    - **Acceso multiplataforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orquestación de herramientas** (navegador, archivos, programación, hooks)
    - **Gateway siempre activo** (ejecútalo en un VPS, interactúa desde cualquier lugar)
    - **Nodes** para navegador/pantalla/cámara/exec locales

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills y automatización

<AccordionGroup>
  <Accordion title="Cómo personalizo Skills sin mantener sucio el repositorio">
    Usa anulaciones gestionadas en lugar de editar la copia del repositorio. Pon tus cambios en `~/.openclaw/skills/<name>/SKILL.md` (o añade una carpeta mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json`). La precedencia es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`, por lo que las anulaciones gestionadas siguen teniendo prioridad sobre las Skills incluidas sin tocar git. Si necesitas que la skill esté instalada globalmente pero solo visible para algunos agentes, mantén la copia compartida en `~/.openclaw/skills` y controla la visibilidad con `agents.defaults.skills` y `agents.list[].skills`. Solo las ediciones dignas de upstream deberían vivir en el repositorio y salir como PR.
  </Accordion>

  <Accordion title="Puedo cargar Skills desde una carpeta personalizada">
    Sí. Añade directorios extra mediante `skills.load.extraDirs` en `~/.openclaw/openclaw.json` (precedencia más baja). La precedencia predeterminada es `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluidas → `skills.load.extraDirs`. `clawhub` instala en `./skills` por defecto, que OpenClaw trata como `<workspace>/skills` en la siguiente sesión. Si la skill solo debería ser visible para ciertos agentes, combínalo con `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Cómo puedo usar modelos diferentes para tareas distintas">
    Hoy, los patrones compatibles son:

    - **Trabajos cron**: los trabajos aislados pueden establecer una anulación `model` por trabajo.
    - **Subagentes**: enruta tareas a agentes separados con distintos modelos predeterminados.
    - **Cambio bajo demanda**: usa `/model` para cambiar el modelo de la sesión actual en cualquier momento.

    Consulta [Cron jobs](/es/automation/cron-jobs), [Multi-Agent Routing](/es/concepts/multi-agent) y [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="El bot se congela mientras hace trabajo pesado. Cómo lo descargo">
    Usa **subagentes** para tareas largas o paralelas. Los subagentes se ejecutan en su propia sesión,
    devuelven un resumen y mantienen tu chat principal con capacidad de respuesta.

    Pídele a tu bot “genera un subagente para esta tarea” o usa `/subagents`.
    Usa `/status` en el chat para ver qué está haciendo el Gateway ahora mismo (y si está ocupado).

    Consejo sobre tokens: las tareas largas y los subagentes consumen tokens. Si el coste es un problema, configura un
    modelo más barato para subagentes mediante `agents.defaults.subagents.model`.

    Documentación: [Sub-agents](/es/tools/subagents), [Background Tasks](/es/automation/tasks).

  </Accordion>

  <Accordion title="Cómo funcionan las sesiones de subagente asociadas a hilos en Discord">
    Usa asociaciones de hilos. Puedes asociar un hilo de Discord a un subagente o a un destino de sesión para que los mensajes de seguimiento en ese hilo permanezcan en esa sesión asociada.

    Flujo básico:

    - Genera con `sessions_spawn` usando `thread: true` (y opcionalmente `mode: "session"` para seguimiento persistente).
    - O asocia manualmente con `/focus <target>`.
    - Usa `/agents` para inspeccionar el estado de la asociación.
    - Usa `/session idle <duration|off>` y `/session max-age <duration|off>` para controlar el desenfoque automático.
    - Usa `/unfocus` para desacoplar el hilo.

    Configuración requerida:

    - Predeterminados globales: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Anulaciones de Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Asociación automática al generar: establece `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentación: [Sub-agents](/es/tools/subagents), [Discord](/es/channels/discord), [Configuration Reference](/es/gateway/configuration-reference), [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente terminó, pero la actualización de finalización fue al lugar equivocado o nunca se publicó. Qué debería comprobar">
    Comprueba primero la ruta del solicitante resuelta:

    - La entrega del subagente en modo finalización prefiere cualquier hilo asociado o ruta de conversación cuando existe.
    - Si el origen de finalización solo tiene un canal, OpenClaw recurre a la ruta almacenada de la sesión solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que la entrega directa aún pueda tener éxito.
    - Si no existe ni una ruta asociada ni una ruta almacenada utilizable, la entrega directa puede fallar y el resultado recurre a una entrega en cola de sesión en lugar de publicarse inmediatamente en el chat.
    - Los destinos no válidos u obsoletos pueden seguir forzando el recurso a cola o un fallo final de entrega.
    - Si la última respuesta visible del asistente del hijo es exactamente el token silencioso `NO_REPLY` / `no_reply`, o exactamente `ANNOUNCE_SKIP`, OpenClaw suprime intencionadamente el anuncio en lugar de publicar progreso anterior obsoleto.
    - Si el hijo agotó el tiempo después de solo llamadas a herramientas, el anuncio puede colapsar eso en un breve resumen de progreso parcial en lugar de reproducir la salida sin procesar de la herramienta.

    Depuración:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Sub-agents](/es/tools/subagents), [Background Tasks](/es/automation/tasks), [Session Tools](/es/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o los recordatorios no se activan. Qué debería comprobar">
    Cron se ejecuta dentro del proceso Gateway. Si el Gateway no está ejecutándose continuamente,
    los trabajos programados no se ejecutarán.

    Lista de comprobación:

    - Confirma que cron está habilitado (`cron.enabled`) y que `OPENCLAW_SKIP_CRON` no está establecido.
    - Comprueba que el Gateway se esté ejecutando 24/7 (sin suspensión/reinicios).
    - Verifica la configuración de zona horaria del trabajo (`--tz` frente a la zona horaria del host).

    Depuración:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Automation & Tasks](/es/automation).

  </Accordion>

  <Accordion title="Cron se activó, pero no se envió nada al canal. Por qué">
    Comprueba primero el modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"` significa que no se espera ningún mensaje externo.
    - Un destino de anuncio faltante o no válido (`channel` / `to`) significa que el ejecutor omitió la entrega saliente.
    - Los fallos de autenticación del canal (`unauthorized`, `Forbidden`) significan que el ejecutor intentó entregar, pero las credenciales lo bloquearon.
    - Un resultado aislado silencioso (`NO_REPLY` / `no_reply` solo) se trata como intencionadamente no entregable, por lo que el ejecutor también suprime la entrega de respaldo en cola.

    Para trabajos cron aislados, el ejecutor es responsable de la entrega final. Se espera
    que el agente devuelva un resumen en texto plano para que el ejecutor lo envíe. `--no-deliver` mantiene
    ese resultado en interno; no permite que el agente envíe directamente con la
    herramienta de mensajes en su lugar.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Background Tasks](/es/automation/tasks).

  </Accordion>

  <Accordion title="Por qué una ejecución cron aislada cambió de modelo o reintentó una vez">
    Normalmente esa es la ruta de cambio de modelo en vivo, no una programación duplicada.

    Cron aislado puede persistir una transferencia de modelo en tiempo de ejecución y reintentar cuando la
    ejecución activa lanza `LiveSessionModelSwitchError`. El reintento conserva el
    proveedor/modelo cambiado, y si el cambio llevaba una nueva anulación de perfil de autenticación, cron
    también la persiste antes de reintentar.

    Reglas de selección relacionadas:

    - La anulación de modelo del hook de Gmail gana primero cuando corresponde.
    - Luego `model` por trabajo.
    - Luego cualquier anulación de modelo almacenada de la sesión cron.
    - Luego la selección normal del modelo predeterminado/del agente.

    El bucle de reintento está acotado. Después del intento inicial más 2 reintentos por cambio,
    cron aborta en lugar de entrar en un bucle infinito.

    Depuración:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentación: [Cron jobs](/es/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Cómo instalo Skills en Linux">
    Usa comandos nativos `openclaw skills` o coloca Skills en tu workspace. La UI de Skills de macOS no está disponible en Linux.
    Explora Skills en [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` nativo escribe en el directorio `skills/` del workspace activo.
    Instala la CLI separada `clawhub` solo si quieres publicar o
    sincronizar tus propias Skills. Para instalaciones compartidas entre agentes, coloca la skill en
    `~/.openclaw/skills` y usa `agents.defaults.skills` o
    `agents.list[].skills` si quieres limitar qué agentes pueden verla.

  </Accordion>

  <Accordion title="Puede OpenClaw ejecutar tareas según un calendario o continuamente en segundo plano">
    Sí. Usa el programador del Gateway:

    - **Trabajos cron** para tareas programadas o recurrentes (persisten entre reinicios).
    - **Heartbeat** para comprobaciones periódicas de la “sesión principal”.
    - **Trabajos aislados** para agentes autónomos que publican resúmenes o entregan a chats.

    Documentación: [Cron jobs](/es/automation/cron-jobs), [Automation & Tasks](/es/automation),
    [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puedo ejecutar Skills exclusivas de Apple macOS desde Linux">
    No directamente. Las Skills de macOS están controladas por `metadata.openclaw.os` más los binarios requeridos, y las Skills solo aparecen en el prompt del sistema cuando son aptas en el **host del Gateway**. En Linux, las Skills solo `darwin` (como `apple-notes`, `apple-reminders`, `things-mac`) no se cargarán salvo que anules ese control.

    Tienes tres patrones compatibles:

    **Opción A: ejecutar el Gateway en un Mac (más sencillo).**
    Ejecuta el Gateway donde existan los binarios de macOS y luego conéctate desde Linux en [modo remoto](#gateway-puertos-ya-en-ejecución-y-modo-remoto) o mediante Tailscale. Las Skills se cargan normalmente porque el host del Gateway es macOS.

    **Opción B: usar un node de macOS (sin SSH).**
    Ejecuta el Gateway en Linux, empareja un node de macOS (app de barra de menús) y establece **Node Run Commands** en “Always Ask” o “Always Allow” en el Mac. OpenClaw puede tratar las Skills exclusivas de macOS como aptas cuando los binarios requeridos existen en el node. El agente ejecuta esas Skills mediante la herramienta `nodes`. Si eliges “Always Ask”, aprobar “Always Allow” en la solicitud añade ese comando a la lista de permitidos.

    **Opción C: hacer proxy de binarios de macOS por SSH (avanzado).**
    Mantén el Gateway en Linux, pero haz que los binarios CLI requeridos se resuelvan a envoltorios SSH que se ejecuten en un Mac. Luego anula la skill para permitir Linux y que siga siendo apta.

    1. Crea un envoltorio SSH para el binario (ejemplo: `memo` para Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Coloca el envoltorio en `PATH` en el host Linux (por ejemplo `~/bin/memo`).
    3. Anula los metadatos de la skill (workspace o `~/.openclaw/skills`) para permitir Linux:

       ```markdown
       ---
       name: apple-notes
       description: Gestiona Apple Notes mediante la CLI memo en macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Inicia una nueva sesión para que se actualice la instantánea de Skills.

  </Accordion>

  <Accordion title="Tienen integración con Notion o HeyGen">
    No integrada de forma nativa por ahora.

    Opciones:

    - **Skill / plugin personalizado:** la mejor opción para acceso fiable a API (Notion/HeyGen ambos tienen APIs).
    - **Automatización del navegador:** funciona sin código, pero es más lenta y más frágil.

    Si quieres mantener contexto por cliente (flujos de agencia), un patrón sencillo es:

    - Una página de Notion por cliente (contexto + preferencias + trabajo activo).
    - Pedirle al agente que recupere esa página al inicio de una sesión.

    Si quieres una integración nativa, abre una solicitud de función o crea una skill
    orientada a esas APIs.

    Instalar Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Las instalaciones nativas llegan al directorio `skills/` del workspace activo. Para Skills compartidas entre agentes, colócalas en `~/.openclaw/skills/<name>/SKILL.md`. Si solo algunos agentes deberían ver una instalación compartida, configura `agents.defaults.skills` o `agents.list[].skills`. Algunas Skills esperan binarios instalados mediante Homebrew; en Linux eso significa Linuxbrew (consulta la entrada de preguntas frecuentes de Homebrew en Linux más arriba). Consulta [Skills](/es/tools/skills), [Skills config](/es/tools/skills-config) y [ClawHub](/es/tools/clawhub).

  </Accordion>

  <Accordion title="Cómo uso mi Chrome ya autenticado con OpenClaw">
    Usa el perfil de navegador integrado `user`, que se conecta mediante Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si quieres un nombre personalizado, crea un perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Esta ruta es local al host. Si el Gateway se ejecuta en otro lugar, ejecuta un host de node en la máquina del navegador o usa CDP remoto.

    Limitaciones actuales de `existing-session` / `user`:

    - las acciones se basan en refs, no en selectores CSS
    - las cargas requieren `ref` / `inputRef` y actualmente admiten un archivo a la vez
    - `responsebody`, exportación PDF, interceptación de descargas y acciones por lotes aún requieren un navegador gestionado o un perfil CDP sin procesar

  </Accordion>
</AccordionGroup>

## Aislamiento y memoria

<AccordionGroup>
  <Accordion title="Hay una documentación dedicada al aislamiento">
    Sí. Consulta [Sandboxing](/es/gateway/sandboxing). Para configuración específica de Docker (gateway completo en Docker o imágenes de sandbox), consulta [Docker](/es/install/docker).
  </Accordion>

  <Accordion title="Docker se siente limitado. Cómo habilito funciones completas">
    La imagen predeterminada prioriza la seguridad y se ejecuta como el usuario `node`, por lo que no
    incluye paquetes del sistema, Homebrew ni navegadores incluidos. Para una configuración más completa:

    - Persiste `/home/node` con `OPENCLAW_HOME_VOLUME` para que las cachés sobrevivan.
    - Incorpora dependencias del sistema a la imagen con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Instala navegadores Playwright mediante la CLI incluida:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Establece `PLAYWRIGHT_BROWSERS_PATH` y asegúrate de que esa ruta persista.

    Documentación: [Docker](/es/install/docker), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="Puedo mantener los MD personales pero hacer públicos/aislados los grupos con un solo agente">
    Sí, si tu tráfico privado son **MD** y tu tráfico público son **grupos**.

    Usa `agents.defaults.sandbox.mode: "non-main"` para que las sesiones de grupo/canal (claves no principales) se ejecuten en Docker, mientras la sesión principal de MD permanece en el host. Luego restringe qué herramientas están disponibles en las sesiones aisladas mediante `tools.sandbox.tools`.

    Guía de configuración + ejemplo: [Groups: personal DMs + public groups](/es/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Referencia de configuración clave: [Gateway configuration](/es/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Cómo funciona la memoria">
    La memoria de OpenClaw son solo archivos Markdown en el workspace del agente:

    - Notas diarias en `memory/YYYY-MM-DD.md`
    - Notas curadas a largo plazo en `MEMORY.md` (solo sesiones principales/privadas)

    OpenClaw también ejecuta un **vaciado silencioso de memoria antes de la compactación** para recordar al modelo
    que escriba notas duraderas antes de la compactación automática. Esto solo se ejecuta cuando el workspace
    es escribible (las sandboxes de solo lectura lo omiten). Consulta [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="La memoria sigue olvidando cosas. Cómo hago que permanezcan">
    Pídele al bot que **escriba el hecho en la memoria**. Las notas a largo plazo deben ir en `MEMORY.md`,
    el contexto a corto plazo va en `memory/YYYY-MM-DD.md`.

    Esta sigue siendo un área que estamos mejorando. Ayuda recordarle al modelo que almacene memorias;
    sabrá qué hacer. Si sigue olvidando, verifica que el Gateway esté usando el mismo
    workspace en cada ejecución.

    Documentación: [Memory](/es/concepts/memory), [Agent workspace](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste para siempre Cuáles son los límites">
    Los archivos de memoria viven en disco y persisten hasta que los elimines. El límite es tu
    almacenamiento, no el modelo. El **contexto de sesión** sigue estando limitado por la ventana de contexto
    del modelo, por lo que las conversaciones largas pueden compactarse o truncarse. Por eso
    existe la búsqueda de memoria: vuelve a traer al contexto solo las partes relevantes.

    Documentación: [Memory](/es/concepts/memory), [Context](/es/concepts/context).

  </Accordion>

  <Accordion title="La búsqueda semántica de memoria requiere una clave API de OpenAI">
    Solo si usas **embeddings de OpenAI**. Codex OAuth cubre chat/completions y
    **no** concede acceso a embeddings, así que **iniciar sesión con Codex (OAuth o el
    inicio de sesión de Codex CLI)** no ayuda para la búsqueda semántica de memoria. Los embeddings de OpenAI
    siguen necesitando una clave API real (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Si no configuras un proveedor explícitamente, OpenClaw selecciona automáticamente uno cuando
    puede resolver una clave API (perfiles de autenticación, `models.providers.*.apiKey` o variables de entorno).
    Prefiere OpenAI si puede resolverse una clave de OpenAI; en caso contrario Gemini si se
    resuelve una clave de Gemini; luego Voyage; luego Mistral. Si no hay una clave remota disponible, la búsqueda
    de memoria permanece desactivada hasta que la configures. Si tienes configurada y presente una ruta de modelo local, OpenClaw
    prefiere `local`. Ollama es compatible cuando estableces explícitamente
    `memorySearch.provider = "ollama"`.

    Si prefieres permanecer en local, establece `memorySearch.provider = "local"` (y opcionalmente
    `memorySearch.fallback = "none"`). Si quieres embeddings de Gemini, establece
    `memorySearch.provider = "gemini"` y proporciona `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Admitimos modelos de embeddings de **OpenAI, Gemini, Voyage, Mistral, Ollama o local**; consulta [Memory](/es/concepts/memory) para los detalles de configuración.

  </Accordion>
</AccordionGroup>

## Dónde se almacenan las cosas en disco

<AccordionGroup>
  <Accordion title="Todos los datos usados con OpenClaw se guardan localmente">
    No: **el estado de OpenClaw es local**, pero **los servicios externos siguen viendo lo que les envías**.

    - **Local por defecto:** sesiones, archivos de memoria, configuración y workspace viven en el host del Gateway
      (`~/.openclaw` + tu directorio de workspace).
    - **Remoto por necesidad:** los mensajes que envías a proveedores de modelos (Anthropic/OpenAI/etc.) van a
      sus APIs, y las plataformas de chat (WhatsApp/Telegram/Slack/etc.) almacenan los datos de mensajes en
      sus servidores.
    - **Tú controlas la huella:** usar modelos locales mantiene los prompts en tu máquina, pero el
      tráfico de canal sigue pasando por los servidores del canal.

    Relacionado: [Agent workspace](/es/concepts/agent-workspace), [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Dónde almacena OpenClaw sus datos">
    Todo vive bajo `$OPENCLAW_STATE_DIR` (predeterminado: `~/.openclaw`):

    | Ruta                                                            | Propósito                                                          |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuración principal (JSON5)                                    |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importación heredada de OAuth (copiada a perfiles de autenticación en el primer uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Perfiles de autenticación (OAuth, claves API y `keyRef`/`tokenRef` opcionales) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Carga útil opcional de secretos respaldada por archivo para proveedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Archivo heredado de compatibilidad (entradas estáticas `api_key` depuradas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Estado del proveedor (p. ej. `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Estado por agente (agentDir + sesiones)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historial y estado de conversación (por agente)                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadatos de sesión (por agente)                                   |

    Ruta heredada de agente único: `~/.openclaw/agent/*` (migrada por `openclaw doctor`).

    Tu **workspace** (`AGENTS.md`, archivos de memoria, Skills, etc.) es independiente y se configura mediante `agents.defaults.workspace` (predeterminado: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dónde deben estar AGENTS.md / SOUL.md / USER.md / MEMORY.md">
    Estos archivos viven en el **workspace del agente**, no en `~/.openclaw`.

    - **Workspace (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (o el respaldo heredado `memory.md` cuando falta `MEMORY.md`),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opcional.
    - **Directorio de estado (`~/.openclaw`)**: configuración, estado de canales/proveedores, perfiles de autenticación, sesiones, registros
      y Skills compartidas (`~/.openclaw/skills`).

    El workspace predeterminado es `~/.openclaw/workspace`, configurable mediante:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si el bot “olvida” después de un reinicio, confirma que el Gateway esté usando el mismo
    workspace en cada inicio (y recuerda: el modo remoto usa el workspace del **host del gateway**,
    no el de tu portátil local).

    Consejo: si quieres un comportamiento o preferencia duraderos, pídele al bot que **lo escriba en
    AGENTS.md o MEMORY.md** en lugar de depender del historial del chat.

    Consulta [Agent workspace](/es/concepts/agent-workspace) y [Memory](/es/concepts/memory).

  </Accordion>

  <Accordion title="Estrategia recomendada de copia de seguridad">
    Pon tu **workspace del agente** en un repositorio git **privado** y hazle copia de seguridad en algún lugar
    privado (por ejemplo, GitHub privado). Esto captura memoria + archivos AGENTS/SOUL/USER
    y te permite restaurar la “mente” del asistente después.

    **No** hagas commit de nada bajo `~/.openclaw` (credenciales, sesiones, tokens o cargas útiles de secretos cifrados).
    Si necesitas una restauración completa, haz copia de seguridad del workspace y del directorio de estado
    por separado (consulta la pregunta de migración más arriba).

    Documentación: [Agent workspace](/es/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Cómo desinstalo completamente OpenClaw">
    Consulta la guía específica: [Uninstall](/es/install/uninstall).
  </Accordion>

  <Accordion title="Pueden los agentes trabajar fuera del workspace">
    Sí. El workspace es el **cwd predeterminado** y el ancla de memoria, no una sandbox estricta.
    Las rutas relativas se resuelven dentro del workspace, pero las rutas absolutas pueden acceder a otras
    ubicaciones del host salvo que el aislamiento esté habilitado. Si necesitas aislamiento, usa
    [`agents.defaults.sandbox`](/es/gateway/sandboxing) o la configuración de sandbox por agente. Si quieres
    que un repositorio sea el directorio de trabajo predeterminado, apunta el
    `workspace` de ese agente a la raíz del repositorio. El repositorio de OpenClaw es solo código fuente; mantén el
    workspace separado salvo que quieras deliberadamente que el agente trabaje dentro de él.

    Ejemplo (repositorio como cwd predeterminado):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: dónde está el almacén de sesiones">
    El estado de la sesión pertenece al **host del gateway**. Si estás en modo remoto, el almacén de sesiones que te importa está en la máquina remota, no en tu portátil local. Consulta [Session management](/es/concepts/session).
  </Accordion>
</AccordionGroup>

## Conceptos básicos de configuración

<AccordionGroup>
  <Accordion title="Qué formato tiene la configuración Dónde está">
    OpenClaw lee una configuración opcional **JSON5** desde `$OPENCLAW_CONFIG_PATH` (predeterminado: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si el archivo falta, usa valores predeterminados razonablemente seguros (incluido un workspace predeterminado de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Configuré gateway.bind: "lan" (o "tailnet") y ahora nada escucha / la UI dice unauthorized'>
    Los bind no loopback **requieren una ruta de autenticación del gateway válida**. En la práctica eso significa:

    - autenticación con secreto compartido: token o contraseña
    - `gateway.auth.mode: "trusted-proxy"` detrás de un proxy inverso con reconocimiento de identidad no loopback correctamente configurado

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notas:

    - `gateway.remote.token` / `.password` **no** habilitan por sí mismos la autenticación del gateway local.
    - Las rutas de llamada local pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está configurado.
    - Para autenticación por contraseña, establece `gateway.auth.mode: "password"` más `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`) en su lugar.
    - Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin enmascaramiento por respaldo remoto).
    - Las configuraciones de Control UI con secreto compartido se autentican mediante `connect.params.auth.token` o `connect.params.auth.password` (almacenados en la configuración de la app/UI). Los modos con identidad, como Tailscale Serve o `trusted-proxy`, usan encabezados de solicitud en su lugar. Evita poner secretos compartidos en las URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, los proxies inversos loopback en el mismo host siguen **sin** satisfacer la autenticación de trusted-proxy. El trusted proxy debe ser una fuente no loopback configurada.

  </Accordion>

  <Accordion title="Por qué ahora necesito un token en localhost">
    OpenClaw aplica autenticación del gateway de forma predeterminada, incluido loopback. En la ruta predeterminada normal eso significa autenticación por token: si no se configura una ruta de autenticación explícita, el inicio del gateway se resuelve al modo token y genera uno automáticamente, guardándolo en `gateway.auth.token`, así que **los clientes WS locales deben autenticarse**. Esto bloquea que otros procesos locales llamen al Gateway.

    Si prefieres otra ruta de autenticación, puedes elegir explícitamente el modo contraseña (o, para proxies inversos no loopback con reconocimiento de identidad, `trusted-proxy`). Si **de verdad** quieres loopback abierto, configura `gateway.auth.mode: "none"` explícitamente en tu configuración. Doctor puede generar un token en cualquier momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Tengo que reiniciar después de cambiar la configuración">
    El Gateway vigila la configuración y admite recarga en caliente:

    - `gateway.reload.mode: "hybrid"` (predeterminado): aplica en caliente los cambios seguros, reinicia para los críticos
    - también se admiten `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Cómo desactivo los eslóganes graciosos de la CLI">
    Configura `cli.banner.taglineMode` en la configuración:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta el texto del eslogan pero mantiene la línea de título/versión del banner.
    - `default`: usa `All your chats, one OpenClaw.` siempre.
    - `random`: eslóganes rotativos graciosos/de temporada (comportamiento predeterminado).
    - Si no quieres ningún banner, establece la variable de entorno `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Cómo habilito la búsqueda web (y web fetch)">
    `web_fetch` funciona sin una clave API. `web_search` depende del proveedor
    seleccionado:

    - Los proveedores respaldados por API como Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity y Tavily requieren su configuración normal de clave API.
    - Ollama Web Search no requiere clave, pero usa tu host Ollama configurado y requiere `ollama signin`.
    - DuckDuckGo no requiere clave, pero es una integración no oficial basada en HTML.
    - SearXNG no requiere clave / es autoalojado; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recomendado:** ejecuta `openclaw configure --section web` y elige un proveedor.
    Alternativas mediante variables de entorno:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` o `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // opcional; omítelo para detección automática
            },
          },
        },
    }
    ```

    La configuración específica del proveedor para búsqueda web ahora vive bajo `plugins.entries.<plugin>.config.webSearch.*`.
    Las rutas heredadas del proveedor `tools.web.search.*` aún se cargan temporalmente por compatibilidad, pero no deberían usarse para configuraciones nuevas.
    La configuración de respaldo de web-fetch de Firecrawl vive bajo `plugins.entries.firecrawl.config.webFetch.*`.

    Notas:

    - Si usas listas de permitidos, añade `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` está habilitado de forma predeterminada (salvo que se desactive explícitamente).
    - Si se omite `tools.web.fetch.provider`, OpenClaw detecta automáticamente el primer proveedor de respaldo de fetch listo a partir de las credenciales disponibles. Hoy, el proveedor incluido es Firecrawl.
    - Los daemons leen variables de entorno desde `~/.openclaw/.env` (o el entorno del servicio).

    Documentación: [Web tools](/es/tools/web).

  </Accordion>

  <Accordion title="config.apply borró mi configuración. Cómo me recupero y cómo lo evito">
    `config.apply` reemplaza la **configuración completa**. Si envías un objeto parcial, se elimina todo
    lo demás.

    Recuperación:

    - Restaura desde una copia de seguridad (git o una copia de `~/.openclaw/openclaw.json`).
    - Si no tienes copia de seguridad, vuelve a ejecutar `openclaw doctor` y reconfigura canales/modelos.
    - Si esto fue inesperado, informa de un error e incluye tu última configuración conocida o cualquier copia de seguridad.
    - Un agente de programación local a menudo puede reconstruir una configuración funcional a partir de registros o historial.

    Cómo evitarlo:

    - Usa `openclaw config set` para cambios pequeños.
    - Usa `openclaw configure` para ediciones interactivas.
    - Usa primero `config.schema.lookup` cuando no estés seguro de una ruta exacta o de la forma de un campo; devuelve un nodo de esquema superficial más resúmenes de hijos inmediatos para profundizar.
    - Usa `config.patch` para ediciones RPC parciales; reserva `config.apply` solo para reemplazo completo de la configuración.
    - Si usas la herramienta `gateway` solo para propietarios desde una ejecución de agente, seguirá rechazando escrituras en `tools.exec.ask` / `tools.exec.security` (incluidos alias heredados `tools.bash.*` que se normalizan a las mismas rutas exec protegidas).

    Documentación: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="Cómo ejecuto un Gateway central con workers especializados en distintos dispositivos">
    El patrón habitual es **un Gateway** (p. ej., Raspberry Pi) más **nodes** y **agents**:

    - **Gateway (central):** posee canales (Signal/WhatsApp), enrutamiento y sesiones.
    - **Nodes (dispositivos):** Macs/iOS/Android se conectan como periféricos y exponen herramientas locales (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** cerebros/workspaces separados para roles especializados (por ejemplo “Hetzner ops”, “Personal data”).
    - **Sub-agents:** generan trabajo en segundo plano desde un agente principal cuando quieres paralelismo.
    - **TUI:** se conecta al Gateway y cambia agentes/sesiones.

    Documentación: [Nodes](/es/nodes), [Remote access](/es/gateway/remote), [Multi-Agent Routing](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="El navegador de OpenClaw puede ejecutarse en headless">
    Sí. Es una opción de configuración:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    El valor predeterminado es `false` (con interfaz). Headless tiene más probabilidades de activar comprobaciones antibot en algunos sitios. Consulta [Browser](/es/tools/browser).

    Headless usa el **mismo motor Chromium** y funciona para la mayoría de la automatización (formularios, clics, scraping, inicios de sesión). Las principales diferencias:

    - No hay ventana visible del navegador (usa capturas de pantalla si necesitas elementos visuales).
    - Algunos sitios son más estrictos con la automatización en modo headless (CAPTCHAs, antibot).
      Por ejemplo, X/Twitter suele bloquear sesiones headless.

  </Accordion>

  <Accordion title="Cómo uso Brave para controlar el navegador">
    Configura `browser.executablePath` con tu binario de Brave (o cualquier navegador basado en Chromium) y reinicia el Gateway.
    Consulta los ejemplos completos de configuración en [Browser](/es/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways remotos y nodes

<AccordionGroup>
  <Accordion title="Cómo se propagan los comandos entre Telegram, el gateway y los nodes">
    Los mensajes de Telegram los maneja el **gateway**. El gateway ejecuta el agente y
    solo entonces llama a nodes mediante el **WebSocket del Gateway** cuando se necesita una herramienta de node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Los nodes no ven tráfico entrante del proveedor; solo reciben llamadas RPC de node.

  </Accordion>

  <Accordion title="Cómo puede mi agente acceder a mi ordenador si el Gateway está alojado remotamente">
    Respuesta corta: **empareja tu ordenador como node**. El Gateway se ejecuta en otro lugar, pero puede
    llamar a herramientas `node.*` (pantalla, cámara, sistema) en tu máquina local a través del WebSocket del Gateway.

    Configuración típica:

    1. Ejecuta el Gateway en el host siempre activo (VPS/servidor doméstico).
    2. Pon el host del Gateway + tu ordenador en la misma tailnet.
    3. Asegúrate de que el WS del Gateway sea accesible (bind de tailnet o túnel SSH).
    4. Abre la app de macOS localmente y conéctala en modo **Remote over SSH** (o tailnet directo)
       para que pueda registrarse como node.
    5. Aprueba el node en el Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    No se requiere ningún puente TCP independiente; los nodes se conectan a través del WebSocket del Gateway.

    Recordatorio de seguridad: emparejar un node de macOS permite `system.run` en esa máquina. Solo
    empareja dispositivos en los que confíes y revisa [Security](/es/gateway/security).

    Documentación: [Nodes](/es/nodes), [Gateway protocol](/es/gateway/protocol), [macOS remote mode](/es/platforms/mac/remote), [Security](/es/gateway/security).

  </Accordion>

  <Accordion title="Tailscale está conectado pero no recibo respuestas. Qué hago">
    Comprueba lo básico:

    - El Gateway está en ejecución: `openclaw gateway status`
    - Estado del Gateway: `openclaw status`
    - Estado del canal: `openclaw channels status`

    Luego verifica autenticación y enrutamiento:

    - Si usas Tailscale Serve, asegúrate de que `gateway.auth.allowTailscale` esté configurado correctamente.
    - Si te conectas mediante túnel SSH, confirma que el túnel local esté activo y apunte al puerto correcto.
    - Confirma que tus listas de permitidos (DM o grupo) incluyan tu cuenta.

    Documentación: [Tailscale](/es/gateway/tailscale), [Remote access](/es/gateway/remote), [Channels](/es/channels).

  </Accordion>

  <Accordion title="Pueden hablarse dos instancias de OpenClaw entre sí (local + VPS)">
    Sí. No hay un puente “bot a bot” integrado, pero puedes conectarlo de varias formas
    fiables:

    **Lo más simple:** usa un canal de chat normal al que ambos bots puedan acceder (Telegram/Slack/WhatsApp).
    Haz que el Bot A envíe un mensaje al Bot B y luego deja que el Bot B responda como de costumbre.

    **Puente CLI (genérico):** ejecuta un script que llame al otro Gateway con
    `openclaw agent --message ... --deliver`, apuntando a un chat donde el otro bot
    escuche. Si un bot está en un VPS remoto, apunta tu CLI a ese Gateway remoto
    mediante SSH/Tailscale (consulta [Remote access](/es/gateway/remote)).

    Patrón de ejemplo (ejecútalo desde una máquina que pueda alcanzar el Gateway objetivo):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Consejo: añade una barrera para que los dos bots no entren en un bucle sin fin (solo menciones,
    listas de permitidos de canal o una regla de “no responder a mensajes de bots”).

    Documentación: [Remote access](/es/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/es/tools/agent-send).

  </Accordion>

  <Accordion title="Necesito VPS separados para varios agentes">
    No. Un Gateway puede alojar varios agentes, cada uno con su propio workspace, valores predeterminados de modelo
    y enrutamiento. Esa es la configuración normal y es mucho más barata y simple que ejecutar
    un VPS por agente.

    Usa VPS separados solo cuando necesites aislamiento estricto (límites de seguridad) o configuraciones muy
    distintas que no quieras compartir. De lo contrario, mantén un solo Gateway y
    usa varios agentes o subagentes.

  </Accordion>

  <Accordion title="Hay alguna ventaja en usar un node en mi portátil personal en lugar de SSH desde un VPS">
    Sí: los nodes son la forma de primera clase de alcanzar tu portátil desde un Gateway remoto, y
    habilitan más que acceso shell. El Gateway se ejecuta en macOS/Linux (Windows mediante WSL2) y es
    ligero (basta con un VPS pequeño o un equipo de clase Raspberry Pi; 4 GB de RAM sobran), por lo que una
    configuración común es un host siempre activo más tu portátil como node.

    - **No se requiere SSH entrante.** Los nodes conectan saliendo al WebSocket del Gateway y usan emparejamiento de dispositivos.
    - **Controles de ejecución más seguros.** `system.run` está controlado por listas de permitidos/aprobaciones del node en ese portátil.
    - **Más herramientas de dispositivo.** Los nodes exponen `canvas`, `camera` y `screen` además de `system.run`.
    - **Automatización local del navegador.** Mantén el Gateway en un VPS, pero ejecuta Chrome localmente mediante un host de node en el portátil, o adjúntate a Chrome local en el host mediante Chrome MCP.

    SSH está bien para acceso shell puntual, pero los nodes son más simples para flujos continuos del agente y
    automatización del dispositivo.

    Documentación: [Nodes](/es/nodes), [Nodes CLI](/cli/nodes), [Browser](/es/tools/browser).

  </Accordion>

  <Accordion title="Los nodes ejecutan un servicio de gateway">
    No. Solo debería ejecutarse **un gateway** por host, salvo que deliberadamente ejecutes perfiles aislados (consulta [Multiple gateways](/es/gateway/multiple-gateways)). Los nodes son periféricos que se conectan
    al gateway (nodes iOS/Android o “modo node” de macOS en la app de barra de menús). Para hosts de node sin interfaz
    y control mediante CLI, consulta [Node host CLI](/cli/node).

    Se requiere un reinicio completo para cambios en `gateway`, `discovery` y `canvasHost`.

  </Accordion>

  <Accordion title="Hay una forma API / RPC de aplicar configuración">
    Sí.

    - `config.schema.lookup`: inspecciona un subárbol de configuración con su nodo de esquema superficial, pista de UI coincidente y resúmenes de hijos inmediatos antes de escribir
    - `config.get`: obtiene la instantánea actual + hash
    - `config.patch`: actualización parcial segura (preferida para la mayoría de las ediciones RPC)
    - `config.apply`: valida + reemplaza la configuración completa, luego reinicia
    - la herramienta de tiempo de ejecución `gateway` solo para propietarios sigue negándose a reescribir `tools.exec.ask` / `tools.exec.security`; los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas

  </Accordion>

  <Accordion title="Configuración mínima razonable para una primera instalación">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Esto establece tu workspace y restringe quién puede activar el bot.

  </Accordion>

  <Accordion title="Cómo configuro Tailscale en un VPS y me conecto desde mi Mac">
    Pasos mínimos:

    1. **Instala + inicia sesión en el VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Instala + inicia sesión en tu Mac**
       - Usa la app de Tailscale e inicia sesión en la misma tailnet.
    3. **Habilita MagicDNS (recomendado)**
       - En la consola de administración de Tailscale, habilita MagicDNS para que el VPS tenga un nombre estable.
    4. **Usa el hostname de tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si quieres Control UI sin SSH, usa Tailscale Serve en el VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Esto mantiene el gateway asociado a loopback y expone HTTPS a través de Tailscale. Consulta [Tailscale](/es/gateway/tailscale).

  </Accordion>

  <Accordion title="Cómo conecto un node de Mac a un Gateway remoto (Tailscale Serve)">
    Serve expone la **Control UI + WS del Gateway**. Los nodes se conectan mediante ese mismo endpoint WS del Gateway.

    Configuración recomendada:

    1. **Asegúrate de que el VPS + el Mac estén en la misma tailnet**.
    2. **Usa la app de macOS en modo Remote** (el destino SSH puede ser el hostname de tailnet).
       La app tunelizará el puerto del Gateway y se conectará como node.
    3. **Aprueba el node** en el gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentación: [Gateway protocol](/es/gateway/protocol), [Discovery](/es/gateway/discovery), [macOS remote mode](/es/platforms/mac/remote).

  </Accordion>

  <Accordion title="Debería instalar en un segundo portátil o simplemente añadir un node">
    Si solo necesitas **herramientas locales** (pantalla/cámara/exec) en el segundo portátil, añádelo como
    **node**. Eso mantiene un solo Gateway y evita duplicar configuración. Las herramientas locales de node son
    actualmente solo para macOS, pero planeamos ampliarlas a otros SO.

    Instala un segundo Gateway solo cuando necesites **aislamiento estricto** o dos bots completamente separados.

    Documentación: [Nodes](/es/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/es/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables de entorno y carga de .env

<AccordionGroup>
  <Accordion title="Cómo carga OpenClaw las variables de entorno">
    OpenClaw lee variables de entorno del proceso padre (shell, launchd/systemd, CI, etc.) y además carga:

    - `.env` desde el directorio de trabajo actual
    - un `.env` global de respaldo desde `~/.openclaw/.env` (también conocido como `$OPENCLAW_STATE_DIR/.env`)

    Ninguno de los archivos `.env` sustituye variables de entorno existentes.

    También puedes definir variables de entorno en línea en la configuración (se aplican solo si faltan en el entorno del proceso):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulta [/environment](/es/help/environment) para ver la precedencia completa y las fuentes.

  </Accordion>

  <Accordion title="Inicié el Gateway mediante el servicio y mis variables de entorno desaparecieron. Qué hago">
    Dos soluciones comunes:

    1. Coloca las claves que faltan en `~/.openclaw/.env` para que se recojan aunque el servicio no herede tu entorno del shell.
    2. Habilita la importación del shell (comodidad con adhesión explícita):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Esto ejecuta tu shell de inicio de sesión e importa solo claves esperadas que falten (nunca sustituye). Equivalentes mediante variables de entorno:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Establecí COPILOT_GITHUB_TOKEN, pero models status muestra "Shell env: off." Por qué'>
    `openclaw models status` informa de si la **importación del entorno del shell** está habilitada. “Shell env: off”
    **no** significa que falten tus variables de entorno; solo significa que OpenClaw no cargará
    automáticamente tu shell de inicio de sesión.

    Si el Gateway se ejecuta como servicio (launchd/systemd), no heredará tu
    entorno del shell. Solución haciendo una de estas cosas:

    1. Pon el token en `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. O habilita la importación del shell (`env.shellEnv.enabled: true`).
    3. O añádelo al bloque `env` de tu configuración (se aplica solo si falta).

    Luego reinicia el gateway y vuelve a comprobar:

    ```bash
    openclaw models status
    ```

    Los tokens de Copilot se leen desde `COPILOT_GITHUB_TOKEN` (también `GH_TOKEN` / `GITHUB_TOKEN`).
    Consulta [/concepts/model-providers](/es/concepts/model-providers) y [/environment](/es/help/environment).

  </Accordion>
</AccordionGroup>

## Sesiones y múltiples chats

<AccordionGroup>
  <Accordion title="Cómo inicio una conversación nueva">
    Envía `/new` o `/reset` como mensaje independiente. Consulta [Session management](/es/concepts/session).
  </Accordion>

  <Accordion title="Las sesiones se reinician automáticamente si nunca envío /new">
    Las sesiones pueden expirar después de `session.idleMinutes`, pero esto está **desactivado de forma predeterminada** (valor predeterminado **0**).
    Establécelo en un valor positivo para habilitar la expiración por inactividad. Cuando está habilitado, el **siguiente**
    mensaje después del período de inactividad inicia un id de sesión nuevo para esa clave de chat.
    Esto no elimina transcripciones; solo inicia una sesión nueva.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Hay una manera de crear un equipo de instancias de OpenClaw (un CEO y muchos agentes)">
    Sí, mediante **enrutamiento multiagente** y **subagentes**. Puedes crear un agente coordinador
    y varios agentes worker con sus propios workspaces y modelos.

    Dicho eso, esto se entiende mejor como un **experimento divertido**. Consume muchos tokens y a menudo
    es menos eficiente que usar un bot con sesiones separadas. El modelo típico que
    imaginamos es un bot con el que hablas, con distintas sesiones para trabajo en paralelo. Ese
    bot también puede generar subagentes cuando haga falta.

    Documentación: [Multi-agent routing](/es/concepts/multi-agent), [Sub-agents](/es/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Por qué se truncó el contexto a mitad de la tarea Cómo lo evito">
    El contexto de sesión está limitado por la ventana del modelo. Chats largos, grandes salidas de herramientas o muchos
    archivos pueden activar compactación o truncado.

    Qué ayuda:

    - Pídele al bot que resuma el estado actual y lo escriba en un archivo.
    - Usa `/compact` antes de tareas largas y `/new` cuando cambies de tema.
    - Mantén el contexto importante en el workspace y pídele al bot que lo vuelva a leer.
    - Usa subagentes para trabajo largo o paralelo para que el chat principal siga siendo más pequeño.
    - Elige un modelo con una ventana de contexto más grande si esto ocurre con frecuencia.

  </Accordion>

  <Accordion title="Cómo restablezco completamente OpenClaw pero lo mantengo instalado">
    Usa el comando de restablecimiento:

    ```bash
    openclaw reset
    ```

    Restablecimiento completo no interactivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Luego vuelve a ejecutar la configuración:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notas:

    - El onboarding también ofrece **Reset** si detecta una configuración existente. Consulta [Onboarding (CLI)](/es/start/wizard).
    - Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), restablece cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
    - Restablecimiento de desarrollo: `openclaw gateway --dev --reset` (solo desarrollo; borra configuración + credenciales + sesiones + workspace de desarrollo).

  </Accordion>

  <Accordion title='Estoy obteniendo errores "context too large". Cómo reinicio o compacto'>
    Usa una de estas opciones:

    - **Compactar** (mantiene la conversación, pero resume turnos anteriores):

      ```
      /compact
      ```

      o `/compact <instructions>` para guiar el resumen.

    - **Restablecer** (id de sesión nueva para la misma clave de chat):

      ```
      /new
      /reset
      ```

    Si sigue ocurriendo:

    - Habilita o ajusta la **depuración de sesión** (`agents.defaults.contextPruning`) para recortar salida antigua de herramientas.
    - Usa un modelo con una ventana de contexto mayor.

    Documentación: [Compaction](/es/concepts/compaction), [Session pruning](/es/concepts/session-pruning), [Session management](/es/concepts/session).

  </Accordion>

  <Accordion title='Por qué veo "LLM request rejected: messages.content.tool_use.input field required"'>
    Este es un error de validación del proveedor: el modelo emitió un bloque `tool_use` sin el
    `input` requerido. Normalmente significa que el historial de la sesión está obsoleto o corrupto (a menudo después de hilos largos
    o un cambio de herramienta/esquema).

    Solución: inicia una sesión nueva con `/new` (mensaje independiente).

  </Accordion>

  <Accordion title="Por qué recibo mensajes de heartbeat cada 30 minutos">
    Los heartbeats se ejecutan cada **30 m** de forma predeterminada (**1 h** al usar autenticación OAuth). Ajusta o desactívalos:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // o "0m" para desactivar
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe pero está efectivamente vacío (solo líneas en blanco y encabezados markdown
    como `# Heading`), OpenClaw omite la ejecución de heartbeat para ahorrar llamadas a API.
    Si el archivo falta, el heartbeat sigue ejecutándose y el modelo decide qué hacer.

    Las anulaciones por agente usan `agents.list[].heartbeat`. Documentación: [Heartbeat](/es/gateway/heartbeat).

  </Accordion>

  <Accordion title='Necesito añadir una "cuenta de bot" a un grupo de WhatsApp'>
    No. OpenClaw se ejecuta en **tu propia cuenta**, así que si estás en el grupo, OpenClaw puede verlo.
    De forma predeterminada, las respuestas en grupos están bloqueadas hasta que permitas remitentes (`groupPolicy: "allowlist"`).

    Si quieres que solo **tú** puedas activar respuestas en grupo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cómo obtengo el JID de un grupo de WhatsApp">
    Opción 1 (la más rápida): sigue los registros y envía un mensaje de prueba en el grupo:

    ```bash
    openclaw logs --follow --json
    ```

    Busca `chatId` (o `from`) terminado en `@g.us`, como:
    `1234567890-1234567890@g.us`.

    Opción 2 (si ya está configurado/en lista de permitidos): lista grupos desde la configuración:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentación: [WhatsApp](/es/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Por qué OpenClaw no responde en un grupo">
    Dos causas comunes:

    - El control por mención está activado (predeterminado). Debes mencionar con @ al bot (o coincidir con `mentionPatterns`).
    - Configuraste `channels.whatsapp.groups` sin `"*"` y el grupo no está en la lista de permitidos.

    Consulta [Groups](/es/channels/groups) y [Group messages](/es/channels/group-messages).

  </Accordion>

  <Accordion title="Los grupos/hilos comparten contexto con los MD">
    Los chats directos se colapsan en la sesión principal de forma predeterminada. Los grupos/canales tienen sus propias claves de sesión, y los temas de Telegram / hilos de Discord son sesiones separadas. Consulta [Groups](/es/channels/groups) y [Group messages](/es/channels/group-messages).
  </Accordion>

  <Accordion title="Cuántos workspaces y agentes puedo crear">
    No hay límites estrictos. Decenas (incluso cientos) van bien, pero vigila:

    - **Crecimiento de disco:** sesiones + transcripciones viven bajo `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coste de tokens:** más agentes significan más uso concurrente del modelo.
    - **Sobrecarga operativa:** perfiles de autenticación, workspaces y enrutamiento de canales por agente.

    Consejos:

    - Mantén un workspace **activo** por agente (`agents.defaults.workspace`).
    - Depura sesiones antiguas (elimina JSONL o entradas del almacén) si el disco crece.
    - Usa `openclaw doctor` para detectar workspaces dispersos y discrepancias de perfiles.

  </Accordion>

  <Accordion title="Puedo ejecutar varios bots o chats al mismo tiempo (Slack), y cómo debería configurarlo">
    Sí. Usa **Multi-Agent Routing** para ejecutar varios agentes aislados y enrutar mensajes entrantes por
    canal/cuenta/par. Slack es compatible como canal y puede asociarse a agentes específicos.

    El acceso al navegador es potente, pero no significa “hacer cualquier cosa que un humano pueda”; antibot, CAPTCHAs y MFA aún pueden
    bloquear la automatización. Para el control de navegador más fiable, usa Chrome MCP local en el host
    o CDP en la máquina que realmente ejecuta el navegador.

    Configuración de mejores prácticas:

    - Host del Gateway siempre activo (VPS/Mac mini).
    - Un agente por rol (asociaciones).
    - Canal(es) de Slack asociados a esos agentes.
    - Navegador local mediante Chrome MCP o un node cuando haga falta.

    Documentación: [Multi-Agent Routing](/es/concepts/multi-agent), [Slack](/es/channels/slack),
    [Browser](/es/tools/browser), [Nodes](/es/nodes).

  </Accordion>
</AccordionGroup>

## Modelos: predeterminados, selección, alias, cambio

<AccordionGroup>
  <Accordion title='Qué es el "modelo predeterminado"'>
    El modelo predeterminado de OpenClaw es el que establezcas como:

    ```
    agents.defaults.model.primary
    ```

    Los modelos se referencian como `provider/model` (ejemplo: `openai/gpt-5.4`). Si omites el proveedor, OpenClaw primero prueba un alias, luego una coincidencia única de proveedor configurado para ese id de modelo exacto, y solo después recurre al proveedor predeterminado configurado como ruta de compatibilidad obsoleta. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw recurre al primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado. Aun así, deberías **establecer explícitamente** `provider/model`.

  </Accordion>

  <Accordion title="Qué modelo recomiendan">
    **Predeterminado recomendado:** usa el modelo de última generación más potente disponible en tu conjunto de proveedores.
    **Para agentes con herramientas o entradas no confiables:** prioriza la potencia del modelo sobre el coste.
    **Para chat rutinario/de bajo riesgo:** usa modelos de respaldo más baratos y enruta por rol del agente.

    MiniMax tiene su propia documentación: [MiniMax](/es/providers/minimax) y
    [Local models](/es/gateway/local-models).

    Regla general: usa el **mejor modelo que puedas permitirte** para trabajo de alto riesgo, y un modelo más barato
    para chat rutinario o resúmenes. Puedes enrutar modelos por agente y usar subagentes para
    paralelizar tareas largas (cada subagente consume tokens). Consulta [Models](/es/concepts/models) y
    [Sub-agents](/es/tools/subagents).

    Advertencia importante: los modelos más débiles o demasiado cuantificados son más vulnerables a prompt
    injection y comportamiento inseguro. Consulta [Security](/es/gateway/security).

    Más contexto: [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="Cómo cambio de modelo sin borrar mi configuración">
    Usa **comandos de modelo** o edita solo los campos de **modelo**. Evita reemplazos completos de configuración.

    Opciones seguras:

    - `/model` en el chat (rápido, por sesión)
    - `openclaw models set ...` (actualiza solo la configuración del modelo)
    - `openclaw configure --section model` (interactivo)
    - editar `agents.defaults.model` en `~/.openclaw/openclaw.json`

    Evita `config.apply` con un objeto parcial salvo que pretendas reemplazar toda la configuración.
    Para ediciones RPC, inspecciona primero con `config.schema.lookup` y prefiere `config.patch`. La carga útil de lookup te da la ruta normalizada, documentación/restricciones superficiales del esquema y resúmenes de hijos inmediatos
    para actualizaciones parciales.
    Si sobrescribiste la configuración, restaura desde una copia de seguridad o vuelve a ejecutar `openclaw doctor` para reparar.

    Documentación: [Models](/es/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/es/gateway/doctor).

  </Accordion>

  <Accordion title="Puedo usar modelos autoalojados (llama.cpp, vLLM, Ollama)">
    Sí. Ollama es la ruta más sencilla para modelos locales.

    Configuración más rápida:

    1. Instala Ollama desde `https://ollama.com/download`
    2. Descarga un modelo local como `ollama pull glm-4.7-flash`
    3. Si también quieres modelos en la nube, ejecuta `ollama signin`
    4. Ejecuta `openclaw onboard` y elige `Ollama`
    5. Elige `Local` o `Cloud + Local`

    Notas:

    - `Cloud + Local` te da modelos en la nube más tus modelos locales de Ollama
    - los modelos en la nube como `kimi-k2.5:cloud` no necesitan una descarga local
    - para cambio manual, usa `openclaw models list` y `openclaw models set ollama/<model>`

    Nota de seguridad: los modelos más pequeños o muy cuantificados son más vulnerables a prompt
    injection. Recomendamos encarecidamente **modelos grandes** para cualquier bot que pueda usar herramientas.
    Si aun así quieres modelos pequeños, habilita el aislamiento y listas de permitidos estrictas de herramientas.

    Documentación: [Ollama](/es/providers/ollama), [Local models](/es/gateway/local-models),
    [Model providers](/es/concepts/model-providers), [Security](/es/gateway/security),
    [Sandboxing](/es/gateway/sandboxing).

  </Accordion>

  <Accordion title="Qué usan OpenClaw, Flawd y Krill como modelos">
    - Estas implementaciones pueden diferir y pueden cambiar con el tiempo; no hay una recomendación fija de proveedor.
    - Comprueba la configuración actual de tiempo de ejecución en cada gateway con `openclaw models status`.
    - Para agentes sensibles a la seguridad/con herramientas, usa el modelo de última generación más potente disponible.
  </Accordion>

  <Accordion title="Cómo cambio de modelo al vuelo (sin reiniciar)">
    Usa el comando `/model` como mensaje independiente:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Estos son los alias integrados. Puedes añadir alias personalizados mediante `agents.defaults.models`.

    Puedes listar los modelos disponibles con `/model`, `/model list` o `/model status`.

    `/model` (y `/model list`) muestra un selector compacto numerado. Selecciona por número:

    ```
    /model 3
    ```

    También puedes forzar un perfil de autenticación específico para el proveedor (por sesión):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Consejo: `/model status` muestra qué agente está activo, qué archivo `auth-profiles.json` se está usando y qué perfil de autenticación se probará a continuación.
    También muestra el endpoint configurado del proveedor (`baseUrl`) y el modo API (`api`) cuando están disponibles.

    **Cómo desanclo un perfil que configuré con @profile**

    Vuelve a ejecutar `/model` **sin** el sufijo `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si quieres volver al valor predeterminado, elígelo desde `/model` (o envía `/model <default provider/model>`).
    Usa `/model status` para confirmar qué perfil de autenticación está activo.

  </Accordion>

  <Accordion title="Puedo usar GPT 5.2 para tareas diarias y Codex 5.3 para programación">
    Sí. Establece uno como predeterminado y cambia cuando lo necesites:

    - **Cambio rápido (por sesión):** `/model gpt-5.4` para tareas diarias, `/model openai-codex/gpt-5.4` para programar con Codex OAuth.
    - **Predeterminado + cambio:** establece `agents.defaults.model.primary` en `openai/gpt-5.4`, luego cambia a `openai-codex/gpt-5.4` al programar (o al revés).
    - **Subagentes:** enruta tareas de programación a subagentes con un modelo predeterminado distinto.

    Consulta [Models](/es/concepts/models) y [Slash commands](/es/tools/slash-commands).

  </Accordion>

  <Accordion title="Cómo configuro fast mode para GPT 5.4">
    Usa un conmutador por sesión o un valor predeterminado de configuración:

    - **Por sesión:** envía `/fast on` mientras la sesión usa `openai/gpt-5.4` o `openai-codex/gpt-5.4`.
    - **Predeterminado por modelo:** establece `agents.defaults.models["openai/gpt-5.4"].params.fastMode` en `true`.
    - **También Codex OAuth:** si también usas `openai-codex/gpt-5.4`, establece ahí la misma marca.

    Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Para OpenAI, fast mode se asigna a `service_tier = "priority"` en solicitudes nativas de Responses compatibles. Las anulaciones de sesión `/fast` prevalecen sobre los valores predeterminados de configuración.

    Consulta [Thinking and fast mode](/es/tools/thinking) y [OpenAI fast mode](/es/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Por qué veo "Model ... is not allowed" y luego no hay respuesta'>
    Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y cualquier
    anulación de sesión. Elegir un modelo que no esté en esa lista devuelve:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ese error se devuelve **en lugar de** una respuesta normal. Solución: añade el modelo a
    `agents.defaults.models`, elimina la lista de permitidos o elige un modelo de `/model list`.

  </Accordion>

  <Accordion title='Por qué veo "Unknown model: minimax/MiniMax-M2.7"'>
    Esto significa que el **proveedor no está configurado** (no se encontró ninguna configuración de proveedor MiniMax ni
    perfil de autenticación), por lo que el modelo no puede resolverse.

    Lista de comprobación para solucionarlo:

    1. Actualiza a una versión actual de OpenClaw (o ejecuta desde el código fuente `main`) y luego reinicia el gateway.
    2. Asegúrate de que MiniMax esté configurado (asistente o JSON), o de que exista autenticación MiniMax
       en env/perfiles de autenticación para que se pueda inyectar el proveedor correspondiente
       (`MINIMAX_API_KEY` para `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax
       almacenado para `minimax-portal`).
    3. Usa el id de modelo exacto (sensible a mayúsculas/minúsculas) para tu ruta de autenticación:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` para configuración con
       clave API, o `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` para configuración OAuth.
    4. Ejecuta:

       ```bash
       openclaw models list
       ```

       y elige de la lista (o `/model list` en el chat).

    Consulta [MiniMax](/es/providers/minimax) y [Models](/es/concepts/models).

  </Accordion>

  <Accordion title="Puedo usar MiniMax como predeterminado y OpenAI para tareas complejas">
    Sí. Usa **MiniMax como predeterminado** y cambia de modelo **por sesión** cuando sea necesario.
    Los respaldos son para **errores**, no para “tareas difíciles”, así que usa `/model` o un agente separado.

    **Opción A: cambiar por sesión**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Luego:

    ```
    /model gpt
    ```

    **Opción B: agentes separados**

    - Predeterminado del agente A: MiniMax
    - Predeterminado del agente B: OpenAI
    - Enruta por agente o usa `/agent` para cambiar

    Documentación: [Models](/es/concepts/models), [Multi-Agent Routing](/es/concepts/multi-agent), [MiniMax](/es/providers/minimax), [OpenAI](/es/providers/openai).

  </Accordion>

  <Accordion title="Son opus / sonnet / gpt atajos integrados">
    Sí. OpenClaw incluye algunos atajos predeterminados (solo se aplican cuando el modelo existe en `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si configuras tu propio alias con el mismo nombre, prevalece tu valor.

  </Accordion>

  <Accordion title="Cómo defino/sobrescribo atajos de modelo (alias)">
    Los alias vienen de `agents.defaults.models.<modelId>.alias`. Ejemplo:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Entonces `/model sonnet` (o `/<alias>` cuando sea compatible) se resuelve a ese ID de modelo.

  </Accordion>

  <Accordion title="Cómo añado modelos de otros proveedores como OpenRouter o Z.AI">
    OpenRouter (pago por token; muchos modelos):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelos GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si haces referencia a un proveedor/modelo pero falta la clave requerida del proveedor, obtendrás un error de autenticación en tiempo de ejecución (p. ej. `No API key found for provider "zai"`).

    **No API key found for provider después de añadir un agente nuevo**

    Esto normalmente significa que el **agente nuevo** tiene un almacén de autenticación vacío. La autenticación es por agente y
    se almacena en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opciones para solucionarlo:

    - Ejecuta `openclaw agents add <id>` y configura la autenticación durante el asistente.
    - O copia `auth-profiles.json` desde el `agentDir` del agente principal al `agentDir` del nuevo agente.

    **No** reutilices `agentDir` entre agentes; causa colisiones de autenticación/sesión.

  </Accordion>
</AccordionGroup>

## Conmutación por error del modelo y "All models failed"

<AccordionGroup>
  <Accordion title="Cómo funciona la conmutación por error">
    La conmutación por error ocurre en dos etapas:

    1. **Rotación de perfiles de autenticación** dentro del mismo proveedor.
    2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

    Los enfriamientos se aplican a los perfiles que fallan (retroceso exponencial), así que OpenClaw puede seguir respondiendo incluso cuando un proveedor tiene límite de tasa o falla temporalmente.

    El conjunto de límite de tasa incluye más que respuestas `429` simples. OpenClaw
    también trata mensajes como `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` y límites periódicos
    de ventana de uso (`weekly/monthly limit reached`) como
    límites de tasa aptos para conmutación por error.

    Algunas respuestas que parecen de facturación no son `402`, y algunas respuestas HTTP `402`
    también permanecen en ese conjunto transitorio. Si un proveedor devuelve
    texto explícito de facturación en `401` o `403`, OpenClaw aún puede mantenerlo en
    la vía de facturación, pero los emparejadores de texto específicos del proveedor permanecen limitados al
    proveedor al que pertenecen (por ejemplo OpenRouter `Key limit exceeded`). Si un mensaje `402`
    en cambio parece un límite de ventana de uso reintentable o un
    límite de gasto de organización/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo trata como
    `rate_limit`, no como una desactivación larga por facturación.

    Los errores de desbordamiento de contexto son diferentes: firmas como
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` o `ollama error: context length
    exceeded` permanecen en la ruta de compactación/reintento en lugar de avanzar
    el respaldo de modelo.

    El texto genérico de error del servidor es intencionadamente más estrecho que “cualquier cosa con
    unknown/error”. OpenClaw sí trata formas transitorias con alcance de proveedor
    como Anthropic simple `An unknown error occurred`, OpenRouter simple
    `Provider returned error`, errores de motivo de parada como `Unhandled stop reason:
    error`, cargas JSON `api_error` con texto transitorio de servidor
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) y errores de proveedor ocupado como `ModelNotReadyException` como
    señales de tiempo de espera/sobrecarga aptas para conmutación por error cuando el contexto del proveedor
    coincide.
    El texto de respaldo interno genérico como `LLM request failed with an unknown
    error.` permanece conservador y no activa por sí solo el respaldo de modelo.

  </Accordion>

  <Accordion title='Qué significa "No credentials found for profile anthropic:default"'>
    Significa que el sistema intentó usar el ID de perfil de autenticación `anthropic:default`, pero no pudo encontrar credenciales para él en el almacén de autenticación esperado.

    **Lista de comprobación para solucionarlo:**

    - **Confirma dónde viven los perfiles de autenticación** (rutas nuevas frente a heredadas)
      - Actual: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Heredada: `~/.openclaw/agent/*` (migrada por `openclaw doctor`)
    - **Confirma que el Gateway carga tu variable de entorno**
      - Si configuraste `ANTHROPIC_API_KEY` en tu shell pero ejecutas el Gateway mediante systemd/launchd, puede que no la herede. Ponla en `~/.openclaw/.env` o habilita `env.shellEnv`.
    - **Asegúrate de estar editando el agente correcto**
      - Las configuraciones multiagente implican que puede haber varios archivos `auth-profiles.json`.
    - **Verificación básica del estado del modelo/autenticación**
      - Usa `openclaw models status` para ver los modelos configurados y si los proveedores están autenticados.

    **Lista de comprobación para solucionar "No credentials found for profile anthropic"**

    Esto significa que la ejecución está fijada a un perfil de autenticación de Anthropic, pero el Gateway
    no puede encontrarlo en su almacén de autenticación.

    - **Usa Claude CLI**
      - Ejecuta `openclaw models auth login --provider anthropic --method cli --set-default` en el host del gateway.
    - **Si quieres usar una clave API en su lugar**
      - Pon `ANTHROPIC_API_KEY` en `~/.openclaw/.env` en el **host del gateway**.
      - Borra cualquier orden fijado que fuerce un perfil faltante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirma que estás ejecutando comandos en el host del gateway**
      - En modo remoto, los perfiles de autenticación viven en la máquina del gateway, no en tu portátil.

  </Accordion>

  <Accordion title="Por qué también intentó Google Gemini y falló">
    Si tu configuración de modelo incluye Google Gemini como respaldo (o cambiaste a un atajo de Gemini), OpenClaw lo probará durante el respaldo de modelo. Si no has configurado credenciales de Google, verás `No API key found for provider "google"`.

    Solución: proporciona autenticación de Google o elimina/evita modelos de Google en `agents.defaults.model.fallbacks` / alias para que el respaldo no se enrute allí.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: el historial de la sesión contiene **bloques de pensamiento sin firmas** (a menudo procedentes de
    un flujo abortado/parcial). Google Antigravity requiere firmas para los bloques de pensamiento.

    Solución: OpenClaw ahora elimina bloques de pensamiento sin firma para Google Antigravity Claude. Si sigue apareciendo, inicia una **sesión nueva** o establece `/thinking off` para ese agente.

  </Accordion>
</AccordionGroup>

## Perfiles de autenticación: qué son y cómo gestionarlos

Relacionado: [/concepts/oauth](/es/concepts/oauth) (flujos OAuth, almacenamiento de tokens, patrones de múltiples cuentas)

<AccordionGroup>
  <Accordion title="Qué es un perfil de autenticación">
    Un perfil de autenticación es un registro de credencial con nombre (OAuth o clave API) vinculado a un proveedor. Los perfiles viven en:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Cuáles son los IDs típicos de perfil">
    OpenClaw usa IDs con prefijo del proveedor como:

    - `anthropic:default` (común cuando no existe identidad de correo)
    - `anthropic:<email>` para identidades OAuth
    - IDs personalizados que elijas (p. ej. `anthropic:work`)

  </Accordion>

  <Accordion title="Puedo controlar qué perfil de autenticación se prueba primero">
    Sí. La configuración admite metadatos opcionales para perfiles y un orden por proveedor (`auth.order.<provider>`). Esto **no** almacena secretos; asigna IDs a proveedor/modo y establece el orden de rotación.

    OpenClaw puede omitir temporalmente un perfil si está en un **enfriamiento** corto (límites de tasa/tiempos de espera/fallos de autenticación) o en un estado **deshabilitado** más largo (facturación/créditos insuficientes). Para inspeccionarlo, ejecuta `openclaw models status --json` y comprueba `auth.unusableProfiles`. Ajuste: `auth.cooldowns.billingBackoffHours*`.

    Los enfriamientos por límite de tasa pueden estar asociados a un modelo. Un perfil que se está enfriando
    para un modelo aún puede ser utilizable para un modelo hermano del mismo proveedor,
    mientras que las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil.

    También puedes establecer una anulación de orden **por agente** (almacenada en el `auth-profiles.json` de ese agente) mediante la CLI:

    ```bash
    # De forma predeterminada usa el agente predeterminado configurado (omite --agent)
    openclaw models auth order get --provider anthropic

    # Bloquea la rotación a un solo perfil (solo prueba este)
    openclaw models auth order set --provider anthropic anthropic:default

    # O establece un orden explícito (respaldo dentro del proveedor)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Borra la anulación (vuelve a auth.order de la configuración / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Para apuntar a un agente específico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Para verificar lo que realmente se probará, usa:

    ```bash
    openclaw models status --probe
    ```

    Si un perfil almacenado se omite del orden explícito, el sondeo informa
    `excluded_by_auth_order` para ese perfil en lugar de probarlo silenciosamente.

  </Accordion>

  <Accordion title="OAuth frente a clave API: cuál es la diferencia">
    OpenClaw admite ambos:

    - **OAuth** a menudo aprovecha el acceso por suscripción (cuando corresponde).
    - **Las claves API** usan facturación por token.

    El asistente admite explícitamente Anthropic Claude CLI, OpenAI Codex OAuth y claves API.

  </Accordion>
</AccordionGroup>

## Gateway: puertos, "already running" y modo remoto

<AccordionGroup>
  <Accordion title="Qué puerto usa el Gateway">
    `gateway.port` controla el único puerto multiplexado para WebSocket + HTTP (Control UI, hooks, etc.).

    Precedencia:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > predeterminado 18789
    ```

  </Accordion>

  <Accordion title='Por qué openclaw gateway status dice "Runtime: running" pero "RPC probe: failed"'>
    Porque “running” es la vista del **supervisor** (launchd/systemd