---
read_when:
    - Quieres abrir la interfaz de usuario de Control con tu token actual
    - Quieres imprimir la URL sin abrir un navegador
summary: Referencia de la CLI para `openclaw dashboard` (abrir la interfaz de usuario de Control)
title: Panel de control
x-i18n:
    generated_at: "2026-04-25T13:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Abre la interfaz de usuario de Control usando tu autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notas:

- `dashboard` resuelve los SecretRef configurados en `gateway.auth.token` cuando es posible.
- `dashboard` sigue `gateway.tls.enabled`: los gateways con TLS habilitado imprimen/abren
  URL de la interfaz de usuario de Control con `https://` y se conectan mediante `wss://`.
- Para tokens gestionados por SecretRef (resueltos o no resueltos), `dashboard` imprime/copia/abre una URL sin token para evitar exponer secretos externos en la salida del terminal, el historial del portapapeles o los argumentos de apertura del navegador.
- Si `gateway.auth.token` está gestionado por SecretRef pero no está resuelto en esta ruta del comando, el comando imprime una URL sin token y una guía de corrección explícita en lugar de incrustar un marcador de posición de token no válido.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Panel de control](/es/web/dashboard)
