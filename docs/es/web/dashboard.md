---
read_when:
    - Cambiar la autenticación del panel de control o los modos de exposición
summary: Acceso y autenticación del panel del Gateway (Control UI)
title: Panel de control
x-i18n:
    generated_at: "2026-04-25T13:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

El panel del Gateway es la Control UI del navegador que se sirve en `/` de forma predeterminada
(se puede sobrescribir con `gateway.controlUi.basePath`).

Apertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))
- Con `gateway.tls.enabled: true`, usa `https://127.0.0.1:18789/` y
  `wss://127.0.0.1:18789` para el endpoint WebSocket.

Referencias clave:

- [Control UI](/es/web/control-ui) para el uso y las capacidades de la interfaz.
- [Tailscale](/es/gateway/tailscale) para la automatización de Serve/Funnel.
- [Superficies web](/es/web) para los modos de bind y las notas de seguridad.

La autenticación se aplica en el handshake de WebSocket mediante la ruta de
autenticación del gateway configurada:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- Encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

Consulta `gateway.auth` en [Configuración del Gateway](/es/gateway/configuration).

Nota de seguridad: la Control UI es una **superficie de administración** (chat, configuración, aprobaciones de exec).
No la expongas públicamente. La interfaz mantiene los tokens de URL del panel en sessionStorage
para la sesión actual de la pestaña del navegador y la URL seleccionada del gateway, y los elimina de la URL tras la carga.
Prefiere localhost, Tailscale Serve o un túnel SSH.

## Ruta rápida (recomendada)

- Después de la incorporación, la CLI abre automáticamente el panel y muestra un enlace limpio (sin token).
- Vuelve a abrirlo en cualquier momento con: `openclaw dashboard` (copia el enlace, abre el navegador si es posible y muestra una sugerencia de SSH si no hay interfaz).
- Si la interfaz solicita autenticación con secreto compartido, pega el token o la
  contraseña configurados en la configuración de Control UI.

## Conceptos básicos de autenticación (local frente a remoto)

- **Localhost**: abre `http://127.0.0.1:18789/`.
- **TLS del Gateway**: cuando `gateway.tls.enabled: true`, los enlaces de panel/estado usan
  `https://` y los enlaces WebSocket de Control UI usan `wss://`.
- **Origen del token de secreto compartido**: `gateway.auth.token` (o
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` puede pasarlo mediante un fragmento de URL
  para un arranque inicial de una sola vez, y la Control UI lo mantiene en sessionStorage para la
  sesión actual de la pestaña del navegador y la URL seleccionada del gateway en lugar de localStorage.
- Si `gateway.auth.token` está gestionado por SecretRef, `openclaw dashboard`
  muestra/copia/abre una URL sin token por diseño. Esto evita exponer
  tokens gestionados externamente en registros del shell, historial del portapapeles o argumentos
  de inicio del navegador.
- Si `gateway.auth.token` está configurado como SecretRef y no se resuelve en tu
  shell actual, `openclaw dashboard` sigue mostrando una URL sin token más
  instrucciones prácticas para configurar la autenticación.
- **Contraseña de secreto compartido**: usa la `gateway.auth.password` configurada (o
  `OPENCLAW_GATEWAY_PASSWORD`). El panel no conserva contraseñas entre recargas.
- **Modos con identidad**: Tailscale Serve puede satisfacer la autenticación de Control UI/WebSocket
  mediante encabezados de identidad cuando `gateway.auth.allowTailscale: true`, y un
  proxy inverso con reconocimiento de identidad que no use loopback puede satisfacer
  `gateway.auth.mode: "trusted-proxy"`. En esos modos, el panel no
  necesita un secreto compartido pegado para el WebSocket.
- **No localhost**: usa Tailscale Serve, un bind sin loopback con secreto compartido, un
  proxy inverso con reconocimiento de identidad sin loopback con
  `gateway.auth.mode: "trusted-proxy"` o un túnel SSH. Las API HTTP siguen usando
  autenticación de secreto compartido a menos que ejecutes intencionadamente
  `gateway.auth.mode: "none"` para entrada privada o autenticación HTTP de trusted-proxy. Consulta
  [Superficies web](/es/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si ves "unauthorized" / 1008

- Asegúrate de que el gateway sea accesible (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` y luego abre `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, los clientes pueden hacer un reintento de confianza con un token de dispositivo en caché cuando el gateway devuelve sugerencias de reintento. Ese reintento con token en caché reutiliza los ámbitos aprobados almacenados en caché del token; los llamadores con `deviceToken` explícito / `scopes` explícitos mantienen el conjunto de ámbitos solicitado. Si la autenticación sigue fallando después de ese reintento, resuelve manualmente la desincronización del token.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es: token/contraseña compartidos explícitos primero, luego `deviceToken` explícito, luego token de dispositivo almacenado y luego token de arranque inicial.
- En la ruta asíncrona de Control UI de Tailscale Serve, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador de autenticación fallida los registre, por lo que
  el segundo reintento incorrecto concurrente ya puede mostrar `retry later`.
- Para los pasos de reparación de desincronización del token, sigue la [Lista de comprobación de recuperación de desincronización de token](/es/cli/devices#token-drift-recovery-checklist).
- Recupera o proporciona el secreto compartido desde el host del gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Contraseña: resuelve la `gateway.auth.password` configurada o
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gestionado por SecretRef: resuelve el proveedor de secretos externo o exporta
    `OPENCLAW_GATEWAY_TOKEN` en este shell, luego vuelve a ejecutar `openclaw dashboard`
  - No hay secreto compartido configurado: `openclaw doctor --generate-gateway-token`
- En la configuración del panel, pega el token o la contraseña en el campo de autenticación
  y luego conéctate.
- El selector de idioma de la interfaz está en **Overview -> Gateway Access -> Language**.
  Forma parte de la tarjeta de acceso, no de la sección Appearance.

## Relacionado

- [Control UI](/es/web/control-ui)
- [WebChat](/es/web/webchat)
