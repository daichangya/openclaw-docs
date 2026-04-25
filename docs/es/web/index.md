---
read_when:
    - Quieres acceder al Gateway mediante Tailscale
    - Quieres la Control UI del navegador y la edición de configuración
summary: 'Superficies web de Gateway: Control UI, modos de enlace y seguridad'
title: Web
x-i18n:
    generated_at: "2026-04-25T13:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

El Gateway sirve una pequeña **Control UI** del navegador (Vite + Lit) desde el mismo puerto que el WebSocket del Gateway:

- predeterminado: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo `/openclaw`)

Las capacidades están en [Control UI](/es/web/control-ui).
Esta página se centra en modos de enlace, seguridad y superficies expuestas a la web.

## Webhooks

Cuando `hooks.enabled=true`, el Gateway también expone un pequeño endpoint de Webhook en el mismo servidor HTTP.
Consulta [Configuración de Gateway](/es/gateway/configuration) → `hooks` para autenticación + cargas útiles.

## Configuración (activada por defecto)

La Control UI está **habilitada por defecto** cuando los recursos están presentes (`dist/control-ui`).
Puedes controlarla mediante configuración:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acceso mediante Tailscale

### Serve integrado (recomendado)

Mantén el Gateway en loopback y deja que Tailscale Serve actúe como proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Luego inicia el gateway:

```bash
openclaw gateway
```

Abre:

- `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

### Enlace tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Luego inicia el gateway (este ejemplo sin loopback usa autenticación por token con secreto compartido):

```bash
openclaw gateway
```

Abre:

- `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

### Internet pública (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // o OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Notas de seguridad

- La autenticación de Gateway es obligatoria por defecto (token, contraseña, trusted-proxy o encabezados de identidad de Tailscale Serve cuando están habilitados).
- Los enlaces que no son loopback **siguen requiriendo** autenticación de gateway. En la práctica, eso significa autenticación por token/contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- El asistente crea autenticación con secreto compartido por defecto y normalmente genera un token de gateway (incluso en loopback).
- En modo de secreto compartido, la IU envía `connect.params.auth.token` o `connect.params.auth.password`.
- Cuando `gateway.tls.enabled: true`, los ayudantes locales de panel y estado muestran URL del panel `https://` y URL WebSocket `wss://`.
- En modos con identidad, como Tailscale Serve o `trusted-proxy`, la comprobación de autenticación del WebSocket se satisface desde los encabezados de la solicitud.
- Para despliegues de Control UI sin loopback, establece `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Sin ello, el inicio del gateway se rechaza por defecto.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo de respaldo de origen por encabezado Host, pero es una degradación de seguridad peligrosa.
- Con Serve, los encabezados de identidad de Tailscale pueden satisfacer la autenticación de Control UI/WebSocket cuando `gateway.auth.allowTailscale` es `true` (no se requiere token/contraseña).
  Los endpoints de la API HTTP no usan esos encabezados de identidad de Tailscale; en su lugar siguen el modo normal de autenticación HTTP del gateway. Establece `gateway.auth.allowTailscale: false` para requerir credenciales explícitas. Consulta [Tailscale](/es/gateway/tailscale) y [Seguridad](/es/gateway/security). Este flujo sin token asume que el host del gateway es de confianza.
- `gateway.tailscale.mode: "funnel"` requiere `gateway.auth.mode: "password"` (contraseña compartida).

## Compilar la IU

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```
